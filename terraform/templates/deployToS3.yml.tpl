jobs:
  deploy:
    name: Upload to Amazon S3
    runs-on: ubuntu-latest
    # These permissions are needed to interact with GitHub's OIDC Token endpoint.
    permissions:
      id-token: write
      contents: read
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      - name: Configure AWS credentials from Test account
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: $ASSUME_ROLE
          aws-region: $AWS_REGION
      - name: Install and build
        run: |
          npm install && npm run build
      - name: Copy files to the test website with the AWS CLI
        run: |
          aws s3 sync dist s3://$WEB_BUCKET --delete
