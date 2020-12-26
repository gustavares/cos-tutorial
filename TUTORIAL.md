# File upload to IBM Cloud Object Storage directly from the browser. Great upload performance.

Usually, applications that do file upload will send it through a server before uploading it to a storage service. 
The problem with this approach is that may you end up with a bottleneck that causes a performance issue when you have multiple clients uploading large files at the same time. 
You can boost up the performance if the client side could upload directly to the storage service.
To achieve this you can use [*IBM Cloud Object Storage*(COS)](https://cloud.ibm.com/docs/cloud-object-storage) service. It uses a subset of the [S3 API](https://cloud.ibm.com/docs/cloud-object-storage/api-reference?topic=cloud-object-storage-compatibility-api), which includes the [**presigned URL**](https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-presign-url) feature. A presigned URL is a temporary link generated from your COS credentials that you can send to clients so they can do operations to specific objects without authentication. The client can use the URL retrieved from the server to upload/download files directly to/from a *bucket* at your COS instance.

The following image shows a simple architecture drawing, the one in the left is what is usually done and the one in the right is what we are going to build:

![Architecture](images/1-architecture.png)

In this tutorial you will: 
- Setup a COS instance to store your files. 
- Build a [**Node.js API**](https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-node) to retrieve presigned URLs from the COS instance using your credentials.
- Build a simple front-end Javascript app to consume the API and upload files to COS using the presigned URLs.

# Prerequisites

- [Node.js and npm](https://nodejs.org/en/) installations. I'm using node 14.15.3 version and npm 6.14.9 version.
- An [IBM Cloud account](https://cloud.ibm.com/registration).
- A text editor. I'm using [VSCode](https://code.visualstudio.com/).
  
# Estimated time

TBD

# Steps

1. [COS instance creation](#1-cos-instance-creation)
   1. 1 [Creating HMAC credential](#11-creating-hmac-credential)
2. [Node Setup](#2-node-setup)

## 1. COS instance creation

Once logged into your IBM Cloud account, type *"Object Storage"* in the search bar at the top and select the Object Storage item or follow this link: [https://cloud.ibm.com/objectstorage/create](https://cloud.ibm.com/objectstorage/create). 

While at the creation screen, leave the "Lite" plan selected, scroll down to give your instance a name, and then click on the "Create" button on the right.

![COS creation](images/2-cos-creation.png)

When inside your COS instance, click on the "Buckets" item in the left, then in the "Create bucket +" button to the right.

![Bucket creation](images/3-bucket-creation.png)

Now, on the create bucket screen select the "Quickly get started" option clicking in the arrow pointing right.

![Bucket select](images/4-bucket-select.png)

Leave the "Create bucket with credentials" option selected, give your bucket a name and click "Next" two times, scroll all the way down and click on the "View bucket configuration" button.

![Bucket naming](images/5-bucket-naming.png)

### 1.1 Creating HMAC Credential

To be able to use presigned URLs we need an [HMAC credential](https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-uhc-hmac-credentials-main).

Click on the "Service credentials" item to the left, then on the "New credential +" button to the right.

![Credential creation](images/6-hmac-creation.png)

Then on the "Create credential" modal, name your credential, click on the "Advance options" button, turn on the "Include HMAC Credential" option, and then click on the "Add" button.

![HMAC credential modal](images/7-hmac-modal.png)

Later we are coming back here to copy the contents of the created credential and paste it in our `~/server/.bluemix/cos_credentials` file to be used by the node.js API.

## 2. Node setup

Create a folder for your server and then create a package.json using `npm init`. I'm using the `esm --yes` option so we can use `import/export` syntax:

```
$ mkdir server && cd server
$ npm init esm --yes
```
After running these commands you should have the following files inside your `server` folder:

```
server
|
└── index.js
└── main.js
└── package.json
└── package-lock.json
```

Now we are going to install the dependencies: 

- [Express](https://expressjs.com/) - to create the API
- [IBM COS SDK for Node.js](https://www.npmjs.com/package/ibm-cos-sdk) - to easily connect to our COS instance
- [Nodemon](https://www.npmjs.com/package/nodemon) - to help in development, automatically restarts the node app when file changes.
  
```
$ npm i -S express ibm-cos-sdk && npm i -S -D nodemon
```
Then add the following line to the `scripts` section of your `package.json` file:

```json
"dev": "nodemon index.js"
```

Your `package.json` file should look something like this:

```json
{
  "name": "server",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "module": "main.js",
  "scripts": {
    "dev": "nodemon index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "esm": "^3.2.25",
    "express": "^4.17.1",
    "ibm-cos-sdk": "^1.9.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.6"
  }
}
```

## 3. Express API setup

Finally, let's start writing our API! In the `main.js` file, we are going to import `express` and setup our server to listen on port `3030`. We are also adding a `/` route just for health check.

```javascript
// ESM syntax is supported.
import express from 'express';

const PORT = 3030;

const app = express();

app.use('/', (req, res) => res.json('API is up and running!'));

app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
});

```

After saving your file, you can open up a terminal and navigate to your `server` directory and type: 

```
$ npm run dev
```

If everything is right, you will see the text `API listening on port 3030` on your console, and everytime you save a file you will see that the server restarts.

### 3.1 **/download** route

### 3.2 **/upload** route

# References

Creating a presigned URL - [https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-presign-url](https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-presign-url)

COS Compatibility S3 API - [https://cloud.ibm.com/apidocs/cos/cos-compatibility](https://cloud.ibm.com/apidocs/cos/cos-compatibility)

Using Node.js - [https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-node](https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-node)