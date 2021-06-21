# SoTBot Token Extractor
This extractor can be run as a docker container and output the RAT. It uses selenium to interact with a headless firefox browser to obtain the token.
This is a small helper tool, to easily extract your SoT API RAT cookie for use with
the [SoTBot](https://github.com/wneessen/sotbot/) Discord bot.

The webpage of the game Sea of Thieves (SoT) exposes a nice REST-API for gathering stats about your profile, for example
collected gold or sailed miles. Interaction with it is only possible by using a remote access token (RAT). The RAT is a
JWT token obtained after a login to Microsoft Live during an OAuth code flow. It is stored in your browser as a cookie
and should be valid for 14 days.

This tool makes the process of aquiring your RAT cookie easy. It is based on Google's Puppeteer Framework and uses
Chromium Headless Browser to browse to the SoT login page and log you in, using the provided credentials. In return
you'll receive a byte blob, which is a Base64 encoded JSON string, that can be fed into the SoTBot's `/setrat` slash
command.

## Security warning
Supplying your Microsoft Live Account credentials to a docker container or application you didn't build yourself and
fully understand the source code is dangerous. Even if you do, credentials shouldn't be kept in cleartext as application
arguments. The point of using OAuth tokens is, you don't have to use credentials in web scraping scripts. Unfortunately
Rare doesn't provide any functionality to obtain one.

Use this as an example how you could extract the Sea of Thieves RAT for yourself. If you still want to use this code, at
least build it yourself.

Binary builds are for the authors own use and shouldn't be trusted.

The RAT gives full access to your account on seaofthieves.com until it expires.

## Content
The Dockerfile is based on Alpine Linux and installs Chromium, NodeJS and npm (including its dependencies).

## Building/Executing
### Via local npm/nodejs
- Get the sources from github
  ```sh
  $ git clone git@github.com:wneessen/sotbot-token-extrator.git
  ```
- Switch directory
  ```sh
  $ cd sotbot-token-extractor
  ```
- Install Node dependencies
  ```sh
  $ npm install
  ```
- Execute with NodeJS
  ```sh
  $ env MS_USER="who@cares.net" MS_LOGIN="securepassword" node dist/sotbot-token-extractor.js
  ```
  
### Local docker image
- Get the sources from github
  ```sh
  $ git clone git@github.com:wneessen/sotbot-token-extrator.git
  ```
- Switch directory
  ```sh
  $ cd sotbot-token-extractor
  ```
- Build the docker image
  ```sh
  $ docker build -t sotbot-token-extrator-local .
  ```
- Run the docker image
  ```sh
  $ docker run --security-opt seccomp=seccomp.json -e MS_USER="who@cares.net" -e MS_PASS="securepassword" sotbot-token-extractor-local
  ```

### Docker Hub Image
There is a [Docker image](https://hub.docker.com/r/wneessen/sotbot-token-extractor) for the extractor available on DockerHub.

To run the Docker image simply issue the following command:
- Download the docker image
  ```sh
  $ sudo docker pull wneessen/sotbot-token-extractor:latest
  ```
- Because of the security settings in docker, we need to run it with a specific seccomp-profile, otherwise Chrome will
  not be able to run. Therefore you need to download the profile file first:
  ```sh
  $ curl -LO https://raw.githubusercontent.com/wneessen/sotbot-token-extractor/master/seccomp.json
  ```
- Run the docker image
  ```sh
  $ docker run --security-opt seccomp=seccomp.json -e MS_USER="who@cares.net" -e MS_PASS="securepassword" wneessen/sotbot-token-extractor
  ```
## Example output
```
$ env MS_USER="who@cares.net" MS_PASS="supersecure" node dist/sotbot-token-extrator.js                                                                   1
Loading www.seaofthieves.com/login page...
Waiting for username field...
Waiting for next page...
Waiting for password field...
Waiting for redirect to SoT website...
Your RAT cookie string: eyJWYWx1ZSI6I[....]
```
