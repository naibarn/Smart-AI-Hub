#!/bin/bash

# Generate self-signed SSL certificates for staging environment
# These are for testing purposes only

echo "Generating self-signed SSL certificates for staging environment..."

# Create SSL directory if it doesn't exist
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/key.pem 2048

# Generate certificate signing request
openssl req -new -key ssl/key.pem -out ssl/cert.csr -subj "/C=US/ST=California/L=San Francisco/O=Smart AI Hub/OU=Staging/CN=localhost"

# Generate self-signed certificate
openssl x509 -req -days 365 -in ssl/cert.csr -signkey ssl/key.pem -out ssl/cert.pem

# Clean up CSR
rm ssl/cert.csr

# Set appropriate permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem

echo "SSL certificates generated successfully!"
echo "Private key: ssl/key.pem"
echo "Certificate: ssl/cert.pem"
echo ""
echo "WARNING: These are self-signed certificates for staging only!"
echo "Do not use in production!"