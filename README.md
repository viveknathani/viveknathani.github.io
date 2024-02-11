# vivekn.dev

This is the code for my personal website. It currently runs on the cheapest VPS available on [Linode](https://www.linode.com/).

## sys admin notes
1. On an Ubuntu VM, run `apt-get update` and `apt-get upgrade`.
2. Install Docker.
2. Use the `.env.example` file to prepare the `.env` file and place it in `~`.
3. Create a `deploy.sh` and place it in `~`.
4. Run `./deploy.sh`.

## deploy.sh

```sh
#!/bin/sh
echo "Removing previous copy"
sudo rm -rf vivekn.dev
echo "Getting latest"
git clone https://github.com/viveknathani/vivekn.dev.git
cp .env vivekn.dev/
cd vivekn.dev
docker build -t website .
docker run -dp 127.0.0.1:8080:8080 website
```

## license
[MIT](./LICENSE)