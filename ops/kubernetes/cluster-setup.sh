#!/bin/bash

echo "Installing helm 3"
# https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3

echo "Adding helm repo"
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add jetstack https://charts.jetstack.io
helm repo update

echo "Creating namespaces"
kubectl create namespace production
kubectl create namespace stage
kubectl create namespace cert-manager

echo "Installing NGINX ingress controller"

helm install ingress-nginx ingress-nginx/ingress-nginx --create-namespace --namespace ingress \
  --set controller.replicaCount=2 \
  --set controller.nodeSelector."kubernetes\.io/os"=linux \
  --set defaultBackend.nodeSelector."kubernetes\.io/os"=linux \
  --set controller.admissionWebhooks.patch.nodeSelector."kubernetes\.io/os"=linux

echo "Installing cert manager"
helm install \
  cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --set installCRDs=true

kubectl -n production create secret tls cloudflare-tls --key privateKey.pem --cert certificate.pem
kubectl -n stage create secret tls cloudflare-tls --key privateKey.pem --cert certificate.pem
