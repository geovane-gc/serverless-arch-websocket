BACKEND_DIR := src
SAM_TEMPLATE := template.yaml
SAM_CONFIG := .samconfig.toml

.PHONY: all pre-push build style

all: build

pre-push:
	@echo "Running npm pre-push script..."
	cd $(BACKEND_DIR) && npm run pre-push && cd ..

build: pre-push
	@echo "Building backend..."
	cd $(BACKEND_DIR) && npm run build-everything && cd ..
	@echo "Validating SAM template..."
	sam validate -t $(SAM_TEMPLATE)
	@echo "Building SAM application..."
	sam build -t $(SAM_TEMPLATE)
	@$(MAKE) style  # Run the style target after sam build

style:
	@echo "Running npm style script..."
	cd $(BACKEND_DIR) && npm run style-graphql && cd ..

deploy:
	@echo "Deploying stack..."
	sam deploy --config-file=$(SAM_CONFIG)