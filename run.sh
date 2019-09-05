REPO_NAME=ao23_landing_page
SERVICE_NAME=dev--$REPO_NAME
echo REPO_NAME:$REPO_NAME
echo SERVICE_NAME:$SERVICE_NAME
#-------------------------------------------------------------------------------
# Remove the old service.
#-------------------------------------------------------------------------------
docker service rm $SERVICE_NAME

#-------------------------------------------------------------------------------
# Build the new image.
#-------------------------------------------------------------------------------
docker build -t rowsheet/$REPO_NAME:dev .

#-------------------------------------------------------------------------------
# Source credentials.
#-------------------------------------------------------------------------------
source ./creds

docker service create \
    --env PORT="$PORT" \
    --publish 8100:80 \
    --name $SERVICE_NAME \
    rowsheet/$REPO_NAME:dev
