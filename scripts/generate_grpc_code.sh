#!/bin/bash

set -eu

PROTOC_VERSION="3.9.1"

# Switch to script location so all relative paths work.
PARENT_PATH=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$PARENT_PATH"

# Setup cleanup trap.
cleanup () {
    echo "Something went wrong! Cleaning up downloaded artifacts..."
    ARG=$?
    rm -f protoc-*.zip readme.txt
    rm -rf ./bin/
    exit $ARG
}
trap cleanup EXIT

# Fetch Liftbridge gRPC Proto definition.
wget -q https://raw.githubusercontent.com/liftbridge-io/liftbridge-grpc/8382298b935c78e9072d870570ba0e1585a29660/api.proto -O ../grpc/api.proto
echo "Downloaded Liftbridge Proto file..."

# Fetch & extract protoc.
OS=$(uname)
if [ "$OS" == "Darwin" ]; then
   wget -q "https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOC_VERSION}/protoc-${PROTOC_VERSION}-osx-x86_64.zip"
elif [ "$OS" == "Linux" ]; then
   wget -q "https://github.com/protocolbuffers/protobuf/releases/download/v${PROTOC_VERSION}/protoc-${PROTOC_VERSION}-linux-x86_64.zip"
else
   echo "Unsupported operating system! Please generate this on Linux or macOS."
   exit 1
fi
echo "Downloaded Google Protobuf compiler..."

unzip -qq protoc-*.zip bin/*
rm -f protoc-*.zip readme.txt

# Calculate absolute paths for the protoc command.
IN_DIR=$(cd ../grpc/ 2> /dev/null && pwd -P)
NODE_MODULES_BIN_DIR=$(cd ../node_modules/.bin/ 2> /dev/null && pwd -P)

# Set up path variables for the generators.
PROTOC_GEN_TS_PATH="${NODE_MODULES_BIN_DIR}/protoc-gen-ts"
PROTOC_GEN_GRPC_PATH="${NODE_MODULES_BIN_DIR}/grpc_tools_node_protoc_plugin"

# Directory to write generated code to (.js and .d.ts files) 
OUT_DIR="../grpc/generated"
mkdir -p ${OUT_DIR}

echo "Running static code generator..."
# Generate gRPC bindings.
./bin/protoc \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --plugin="protoc-gen-grpc=${PROTOC_GEN_GRPC_PATH}" \
    --js_out="import_style=commonjs,binary:${OUT_DIR}" \
    --ts_out="service=grpc-node:${OUT_DIR}" \
    --grpc_out="${OUT_DIR}" \
    --proto_path="${IN_DIR}" \
    ${IN_DIR}/api.proto

# Cleanup protoc download.
rm -rf ./bin/

# Remove exit trap.
trap - EXIT

echo "Done generating!"
