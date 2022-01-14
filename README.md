# pdf_ocr

![Screenshot of main interface](/.github/screenshot.png)

## Summary

A web interface for performing [Optical Character Recognition](https://en.wikipedia.org/wiki/Optical_character_recognition) on PDF files. Simply upload a PDF file using the provided form and you will, after a while, be presented with a zipfile containing its pages in text format. Note: Processing may be very slow and so either great hardware or great patience (and sometimes both) are advised.

## Usage

This web interface is best deployed as a [Docker](https://www.docker.com) image either locally or in a more advanced configuration with an ingress service. For this purpose a Dockerfile is provided, ready to build.

## Security Warning

Apart from very rudimentary input sanitation there is no security or authentication provided, therefore _great caution_ is advised when exposing the interface to an untrusted network. In addition, since OCR processing can be very CPU-intensive, performing a [denial-of-service attack](https://en.wikipedia.org/wiki/Denial-of-service_attack) through request flooding is extremely easy.
