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

You can find the entire code created for the tutorial in this repo [https://github.com/gustavares/cos-tutorial/](https://github.com/gustavares/cos-tutorial/)
  
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

Later we are coming back here to copy the contents of the created credential and paste it in our `.env` file.

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

Then create the three extra files that we are going to need later: `routes.js`, `cos.js`, and `.env`:

```
server
|
└── index.js  // requires ESM modules and calls 'main.js'
└── main.js   // app start and express config
└── package.json
└── package-lock.json
└── routes.js // holds our API routes
└── cos.js    // handles everything related to COS
└── .env      // holds our environment variables
```
### 2.1 COS environment variables

Open the `.env` file and create the following variables and copy the correspondent values from the HMAC credential created earlier.

```
COS_ENDPOINT=<endpoint> // check the next section to get this value
COS_APIKEYID=<api-key>
COS_IBM_AUTH_ENDPOINT=https://iam.cloud.ibm.com/identity/token
COS_RESOURCE_INSTANCE_ID=<resource-instance-id>
COS_HMAC_ACCESS_KEY_ID=<access_key_id>
COS_HMAC_SECRET_ACCESS_KEY=<secret_access_key>
```

You can find these values in your COS instance on IBM Cloud, clicking on the "Service credentials" item on the left.

![HMAC copy](images/8-hmac-copy.png)

*NOTE: This might be obvious but never expose your credentials! Don't forget to add the .env file to .gitignore.*

#### 2.1.1 Getting the **COS_ENDPOINT** variable value

- Back in your COS instance, click in the **"Buckets"** item on the left, then click in the bucket we created earlier.
- On the left again, click in the **"Configuration"** item and scroll down to find the **"Endpoints"** section.
- Copy the **"Public"** url to your clipboard.
  ![Endpoint copy](images/9-endpoint-copy.png)
- Back in your text editor, in the `.env` file, paste the endpoint value for the `COS_ENDPOINT` variable.

Now we are going to install the dependencies: 

- [Express](https://expressjs.com/) - to create the API
- [IBM COS SDK for Node.js](https://www.npmjs.com/package/ibm-cos-sdk) - to easily connect to our COS instance
- [dotenv](https://www.npmjs.com/package/dotenv) - to read environment variables from `.env` file
- [Nodemon](https://www.npmjs.com/package/nodemon) - to help in development, automatically restarts the node app when file changes.
  
```
$ npm i -S express ibm-cos-sdk dotenv && npm i -S -D nodemon
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
    "dotenv": "^8.2.0",
    "esm": "^3.2.25",
    "express": "^4.17.1",
    "ibm-cos-sdk": "^1.9.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.6"
  }
}
```

### 2.1 Enabling CORS requests to our bucket

In order to use the presigned URL feature, first we need to enable CORS requests to our bucket. To do this we will write a simple script that will send a CORS configuration object to our bucket using the `ibm-cos-sdk`.

#### 2.1.1 Configuring the COS connection object

- Open the `cos.js` file and import `S3` and `Credentials` classes from the `ibm-cos-sdk` and the `dotenv` module.
- Instantiate and export an object called `cos` that receveis an instance of the `S3` class, passing a config object to the constructor like below.
  
This file will also holds the functions to get the presigned URLs and will be used by our API.
```javascript
// cos.js
import { S3, Credentials } from 'ibm-cos-sdk';
import dotenv from 'dotenv';

dotenv.config();

export const cos = new S3({
    endpoint: process.env.COS_ENDPOINT,
    apiKeyId: process.env.COS_APIKEYID,
    ibmAuthEndpoint: process.env.COS_IBM_AUTH_ENDPOINT,
    serviceInstanceId: process.env.COS_RESOURCE_INSTANCE_ID,
    credentials: new Credentials(
        process.env.COS_HMAC_ACCESS_KEY_ID, 
        process.env.COS_HMAC_SECRET_ACCESS_KEY,
        null
    ),
    signatureVersion: 'v4'
});
```

#### 2.1.2 Creating the script

- Create a file called `bucketCorsConfig.js` under the `server` folder.
- Import the `cos` object from the `cos.js` module.
- Create the `enableCorsRequests` async function, copy the implementation from below. This function sends a configuration object that enables `PUT` requests from any origins to the provided bucket. [Here](https://cloud.ibm.com/docs/cloud-object-storage-cli-plugin?topic=cloud-object-storage-cli-plugin-ic-cos-cli#ic-set-bucket-cors) you can read about the `putBucketBucketCors` method we used.
- Lastly, at the end of the file call the created method passing your bucket name, mine is `cos-tutorial-presigned`.
  
```javascript
// bucketCorsConfig.js
import { cos } from './cos';

async function enableCorsRequests(bucketName) {
    try {
        const data = await cos.putBucketCors({
            Bucket: bucketName,
            CORSConfiguration: {
                CORSRules: [
                    {
                        'AllowedMethods': ['PUT'],
                        'AllowedOrigins': ['*'],
                        'AllowedHeaders': ['*']
                    }
                ],
            }
        }).promise();
    } catch(e) {
        console.error(`[OBJECT STORAGE] ERROR: ${e.code} - ${e.message}\n`);
        return false;
    }

    console.log(`[OBJECT STORAGE] Configured CORS for ${bucketName}`);
    return true;
}

enableCorsRequests('cos-tutorial-presigned');
```

Now you can open your terminal and navigate to your `server` directory and run the script with the following command:
```
$ node -r esm bucketCorsConfig.js
```

If everything was alright you will see the following message in the console:
```
[OBJECT STORAGE] Configured CORS for [name of your bucket]
```

## 3. Express API setup

Finally, let's start writing our API! In the `main.js` file, we are going to import `express` and setup our server to listen on port `3030`. We are also adding a `/health` route just for health check.

```javascript
// ESM syntax is supported.
import express from 'express';

const PORT = 3030;

const app = express();

app.use('/health', (req, res) => res.json('API is up and running!'));

app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
});

```

After saving your file, you can open up a terminal and navigate to your `server` directory and type: 

```
$ npm run dev
```

If everything is right, you will see the text `API listening on port 3030` on your console, and everytime you save a file you will see that the server restarts.

*NOTE: This is a configuration intended only for the purposes of this tutorial and should not be used in production. Please follow the best practices described in the Express website cited below if you intend to deploy it to a production environment.*

**Express Production Best Practices**

Security - [https://expressjs.com/en/advanced/best-practice-security.html](https://expressjs.com/en/advanced/best-practice-security.html)

Performance and Reliability - [https://expressjs.com/en/advanced/best-practice-performance.html](https://expressjs.com/en/advanced/best-practice-performance.html)
    
### 3.1 **/download** route

Now let's create our route to get an URL to download files. In the `routes.js` file:
- Import the `Router` class from `expresss` and the `cos.js` file. 
- Instatiate an object `router`, and call the `.use` method from it to create a `/download` route with an `async` handler function with the `req`, `res`, `next` parameters. 
- From the `req` object get the `params` `bucket` and `fileName`.
- Inside the handler function, create a `try/catch` block.
- In the `try` block call the function `getPresignedDownloadUrl` from the `cos` module, passing the `bucket` and `fileName` to it, we are going to implement it right next to this section.
- In the `catch` block just send the error to the `next` middleware.
- Lastly, at the end of the file export a variable called `presignedRoutes` that receives the `router` object.

```javascript
import { Router } from 'express';
import { getPresignedDownloadUrl } from './cos';

const router = Router();

router.use('/download', async (req, res, next) => {
    const { bucket, fileName } = req.params;

    try {
        const url = await getPresignedDownloadUrl(bucket, fileName);

        return res.status(200).json({ url });
    } catch(e) {
        next(e);
    }    
});

export const presignedRoutes = router;
```

In the `cos.js` file, let's create and export an async function called `getPresignedDownloadUrl` function: 

```javascript
export async function getPresignedDownloadUrl(bucket, fileName) {
    const url = await cos.getSignedUrl('getObject', {
        Bucket: bucket,
        Key: fileName,
        Expires: URL_EXPIRATION_TIME,
    });

    return url;
}
```

We are using the `getSignedUrl` method from the `ibm-cos-sdk`, the first parameter we determine the type of operation that the generated URL will be able to do, in this case we are using `getObject`, a `GET` operation to download an object. The second parameter is an options object with:

    - `Bucket`: [the bucket name]
    - `Key: [the file name]

You can also pass an `Expires` option to determine how long the URL will live, if no value is passed it defaults to 900 seconds(15 minutes). Read more about the `getSignedUrl` method: [https://ibm.github.io/ibm-cos-sdk-js/AWS/S3.html#getSignedUrl-property](https://ibm.github.io/ibm-cos-sdk-js/AWS/S3.html#getSignedUrl-property)

### 3.2 **/upload** route

# References

Creating a presigned URL - [https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-presign-url](https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-presign-url)

COS Compatibility S3 API - [https://cloud.ibm.com/apidocs/cos/cos-compatibility](https://cloud.ibm.com/apidocs/cos/cos-compatibility)

Using Node.js - [https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-node](https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-node)