# File upload to IBM Cloud Object Storage directly from the browser, great upload performance. (Node.js back-end + React front-end)

Usually, applications that do file upload will send it through a server before uploading it to a storage service. 
The problem with this approach is that may you end up with a bottleneck that causes a performance issue when you have multiple clients uploading large files at the same time. 
You can boost up the performance if the client side could upload directly to the storage service.
To achieve this you can use [*IBM Cloud Object Storage*(COS)](https://cloud.ibm.com/docs/cloud-object-storage) service. It uses a subset of the [S3 API](https://cloud.ibm.com/docs/cloud-object-storage/api-reference?topic=cloud-object-storage-compatibility-api), which includes the [**presigned URL**](https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-presign-url) feature. A presigned URL is a temporary link generated from your COS credentials that you can send to clients so they can do operations to specific objects without authentication. The client can use the URL retrieved from the server to upload/download files directly to/from a *bucket* at your COS instance.

The following image shows a simple architecture drawing, the one in the left is what is usually done and the one in the right is what we are going to build:

![Architecture](images/1-architecture.png)

In this tutorial you will: 
- Setup a COS instance to store your files. 
- Build a [**Node.js API**](https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-node) to retrieve presigned URLs from the COS instance using your credentials.
- Build a simple React front-end app to consume the API and upload files to COS using the presigned URLs.

# Prerequisites

- [Node.js and npm](https://nodejs.org/en/) installations. I'm using node 14.15.3 version and npm 6.14.9 version.
- An [IBM Cloud account](https://cloud.ibm.com/registration).
- A text editor. I'm using [VSCode](https://code.visualstudio.com/).

You can find the entire code created for the tutorial in this repo [https://github.com/gustavares/cos-tutorial/](https://github.com/gustavares/cos-tutorial/)
  
# Estimated time

TBD

# Steps

<!-- no toc -->
- [1. COS instance creation](#1-cos-instance-creation)
  - [1.1 Creating HMAC Credential](#11-creating-hmac-credential)
- [2. Node setup](#2-node-setup)
  - [2.1 COS environment variables](#21-cos-environment-variables)
    - [2.1.1 Getting the **COS_ENDPOINT** variable value](#211-getting-the-cos_endpoint-variable-value)
  - [2.2 Enabling CORS requests to our bucket](#22-enabling-cors-requests-to-our-bucket)
    - [2.2.1 Configuring the COS connection object](#221-configuring-the-cos-connection-object)
    - [2.2.2 Creating the script](#222-creating-the-script)
- [3. Express API setup](#3-express-api-setup)
  - [3.1 COS functions](#31-cos-functions)
    - [3.1.1 listFilesFromBucket function](#311-listfilesfrombucket-function)
    - [3.1.2 getPresignedUrl function](#312-getpresignedurl-function)
  - [3.2 Routes](#32-routes)
    - [3.2.1 List files route](#321-list-files-route)
    - [3.2.2 Download and Upload routes](#322-download-and-upload-routes)
- [4. Front-end React application](#4-front-end-react-application)
- [References](#references)
        

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

### 2.2 Enabling CORS requests to our bucket

In order to use the presigned URL feature, first we need to enable CORS requests to our bucket. To do this we will write a simple script that will send a CORS configuration object to our bucket using the `ibm-cos-sdk`.

#### 2.2.1 Configuring the COS connection object

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

#### 2.2.2 Creating the script

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
app.use(cors());

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
    
### 3.1 COS functions

We will add two functions to the `cos.js` file: `getPresignedUrl` and `listFilesFromBucket`. Check the implementation below:

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

export async function listFilesFromBucket(bucketName) {
    const result = await cos.listObjects({
        Bucket: bucketName
    }).promise();

    if (result === null || result.Contents === null) {
        return [];
    }

    return result.Contents.map(object => object.Key);
}

export async function getPresignedUrl(bucket, fileName, operation) {
    const url = await cos.getSignedUrl(operation, {
        Bucket: bucket,
        Key: fileName,
    });

    return url;
}
```

We don't check for errors because we leave this resposability for the caller, which is wrapped in a `try/catch` block like we will see in the next [section](#32-routes).

#### 3.1.1 listFilesFromBucket function 

From the `cos` object, we are calling the `listObjects` method from the `ibm-cos-sdk`, passing an options object with the bucket name. Then we check if the `results` object or its `Contents` property are `null`, if so we return an empty array. If there is content to be return we map the `Contents` object to get its `Key` property, which is the file name.

#### 3.1.2 getPresignedUrl function
From the `cos` object, we are calling the `getSignedUrl` method from the `ibm-cos-sdk`, passing the operation we want the URL to be able to do and an options object with the bucket and file names. To upload a file we are going to pass `putObject` as the operation, if we want to download a file we are going to pass `getObject`.

You can also pass an `Expires` option to determine how long the URL will live, if no value is passed it defaults to 900 seconds(15 minutes). Read more about the `getSignedUrl` method: [https://ibm.github.io/ibm-cos-sdk-js/AWS/S3.html#getSignedUrl-property](https://ibm.github.io/ibm-cos-sdk-js/AWS/S3.html#getSignedUrl-property)

### 3.2 Routes

These are the routes we are going to create:

```
GET /api/buckets/:bucketName/files/:key/presigned/download - to get the URL to download files
GET /api/buckets/:bucketName/files/:key/presigned/upload - to get the URL to upload files
GET /api/buckets/:bucketName/files - to get a list of all the files in the bucket
```

This is how the `cos.js` will look like:

```javascript
// routes.js
import { Router } from 'express';
import { getPresignedUrl, listFilesFromBucket } from './cos';

const router = Router();

router.get('/:bucketName/files', async (req, res, next) => {
    
    try {
        const fileList = await listFilesFromBucket();

        res.status(200).json({ files: fileList });
    } catch (e) {
        next(e);
    }
}); 

router.get('/:bucketName/files/:key/presigned/upload', (req, res, next) => {
    res.locals.operation = 'putObject';
    
    next();
}, presignedController);

router.get('/:bucketName/files/:key/presigned/download', (req, res, next) => {  
    res.locals.operation = 'getObject';
    
    next();
}, presignedController);

async function presignedController(req, res, next) {
    const { bucket, fileName } = req.query;
    const { operation } = res.locals;

    try {
        const url = await getPresignedUrl(bucket, fileName, operation);

        return res.status(200).json({ url });
    } catch(e) {
        next(e);
    }
}

export const presignedRoutes = router;
```

We import the `Router` class from `expresss` and the functions `getPresignedUrl` and `listFilesFromBucket` from the `cos.js` file. From the `Router` constructor we instantiate an object `router`.

#### 3.2.1 List files route

It is a simple `GET` route that receives the `bucketName` as an URL parameter that we pass in to the `listFilesFromBucket` from the `cos` module. We wrap the call in a `try/catch` block to handle any errors. If no errors occured we return the response object with a status 200 and the list of files in a JSON format.

#### 3.2.2 Download and Upload routes

Both will use pretty much the same code, the only difference is the operation value. So each one will have its own middleware to set those values but just a single `presignedController` function. We use the `res.locals` object property to this.

In the controller function we get the `bucket` and `fileName` from the `req.params` object and the `operation` value from the `res.locals` object that was set in the previous middleware. Then we wrap the `getPresignedUrl` function in a `try/catch` block, if an error is caught we send it to the next middlware otherwise we return the `url` in a JSON format with a status 200. 

Lastly, at the end of the file export a variable called `bucketRoutes` that receives the `router` object, we need to use it in the express server later.

Under the `/upload` route create the `/download` route, your `routes.js` file should look like this:

To finish up, in the `main.js` file import the `bucketRoutes` from `routes.js` and use it as a middleware like below:

```javascript
// main.js
import express from 'express';
import { bucketRoutes } from './routes';

const PORT = 3030;

const app = express();

app.use('/health', (req, res) => res.json('API is up and running!'));

app.use('/api/buckets', bucketRoutes);

app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
});
```

### 3.3 Testing the API

Our API is ready to be used, you can test it using something like [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/). For the examples below I have used Insomnia.

## 4. Front-end React application

Our front-end will will be composed of two modules, the first being a form to select a file from your file system, the second module is a list of the files in the bucket. 

First we are going to create a React application using `create-react-app`. In your terminal, outside the `server` folder, type the following:

```
$ npx create-react-app web
```

It created a folder called `web` with default files to run a React app. 

Now create the following file structure from it:

```
web
|
└── public    // holds the static assets
└── src       // has the the React app code
|   └── components 
|   |   └── fileButton.js
|   |   └── fileList.js
|   |   └── uploadInput.js
|   └── api.js
|   └── App.css
|   └── App.js
|   └── App.test.js
|   └── index.css
|   └── index.js
|   └── logo.svg
|   └── reportWebVitals.js
|   └── setupTests.js
└── .env
└── package.json
└── package-lock.json
```

Inside the `src` folder create a file called `api.js` and a folder `components` with the files `fileButton.js`, `fileList.js`, `uploadInput.js`. In the root folder create the `.env` file.

### 4.1 .env file

The `.env` file will have just one environment variable:

```
REACT_APP_API_URL=http://localhost:3030/api
```

### 4.2 api.js file

```javascript
// api.js
import axios from 'axios';

export const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL
});

export const BUCKET_NAME = 'cos-tutorial-presigned';
```

This file just exports an `axios` instance to be used for API calls and the constant `BUCKET_NAME` that holds our COS bucket name.

### 4.3 fileButton.js

```javascript
// fileButton.js
import { api, BUCKET_NAME } from "../api";

const File = ({ filename }) => {
    async function fetchDownloadUrl() {
        try {
            const response = await api.get(`/buckets/${BUCKET_NAME}/files/${filename}/presigned/download`);

            if (response.status >= 400) {
                throw response.data;
            }

            return response.data.url;
        } catch(e) {
            console.log(e);
        }
    }

    async function downloadFile() {
        const url = await fetchDownloadUrl();
        const a = document.createElement('a');

        a.target = '_blank';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
    }

    return (
        <>
            {filename !== undefined ? (
                <li style={{ listStyleType: "none", margin: "10px" }} >
                    <button onClick={downloadFile}>
                        {filename}
                    </button>
                </li>
            ) : (
                <></>
            )}
        </>
    )
}

export default File;
```

This component represents a file that have already been uploaded. When you click the button it will first make a request to our API to fetch the download URL, then uses this URL to download the file. It creates an `a` element in memory and we will programmatically click on it to start the download in a new tab.

### 4.4 fileList.js

```javascript
// fileList.js
import File from './fileButton';

function FileList({ fileList }) {
    return (
        <ul>
            {fileList.map((filename, index) => {
                
                return (
                    <File key={index} filename={filename}/>
                )
            })}
        </ul>
    );
}

export default FileList;
```

This is a simple component that will hold the list of files, it does not have any logic, just receives the list of files as a `prop` and loops through it to render.

### 4.4 uploadInput.js
```javascript
// uploadInput.js
import { api, BUCKET_NAME } from '../api';
import { useState } from 'react';

function UploadInput({fileList, setFileList }) {
    const [ selectedFile, setSelectedFile ] = useState();
    const [ uploadProgress, setUploadProgress ] = useState();

    async function fetchUploadUrl(filename) {
        try {
            const response = await api.get(`/buckets/${BUCKET_NAME}/files/${filename}/presigned/upload`);

            if (response.status >= 400) {
                throw response.data;
            }

            return response.data.url;
        } catch(e) {
            console.log(e);
        }
    }
    
    function handleInputChange(event) {
        const file = event.target.files[0];

        if (file) {
            setSelectedFile(file);
        }
    }

    async function uploadFile() {
        if (selectedFile === undefined) {
            alert('Please select a file first.');
            return;
        }

        try {
            const url = await fetchUploadUrl(selectedFile.name);
            const response = await api.put(url, selectedFile, {
                onUploadProgress: (progressEvent) => {
                    setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                }
            });

            if (response.status >= 400) {
                throw response.data;
            }

            setFileList([...fileList, selectedFile.name]);
            setUploadProgress(undefined);
            
            alert(`${selectedFile.name} uploaded successfully!`);
        } catch (e) {
            console.log(e);
        }

        document.getElementById('fileInput').value = '';
    }

    return (
        <div>
            <input id="fileInput" type="file" onChange={handleInputChange}/>

            <button onClick={uploadFile}>Upload file</button>

            {uploadProgress ? (
                <span style={{ marginLeft: "30px"}}>
                    {uploadProgress}%
                </span>
            ) : (
                <></>
            )}
        </div>
    );
}

export default UploadInput;
```

This component has three parts, the first is an `input` field to attach the file. Then there is a `button` that, if there is a file attached in the `input`, when clicked starts the upload logic. First it fetches the upload URL from our API then uses the URL to make a `PUT` request to upload the file. It sets up the `onUploadProgress` event to track the upload progress which is rendered by the last part of the component, a `span` element.

### 4.5 App.js

```javascript
import { useEffect, useState } from 'react';
import FileList from './components/fileList';
import UploadInput from './components/uploadInput';
import { api, BUCKET_NAME } from './api';
import './App.css';

function App() {
  const [ fileList, setFileList ] = useState([]);
  const [ loading, setLoading ] = useState(true);

  useEffect(() => {
      (async () => {
        const files = await fetchFileList();

        setFileList(files);
        setLoading(loading => !loading);
      })();
  }, []);

  async function fetchFileList() {
    try {
        const response = await api.get(`/buckets/${BUCKET_NAME}/files`);

        if (response.status >= 400) {
            throw response.data;
        }

        return response.data.files;
    } catch (e) {
        console.log(e);
    }
  }

  return (
    <div className="App">
      <UploadInput fileList={fileList} setFileList={setFileList}/>

      <h3>Files from {BUCKET_NAME} bucket</h3>
      {loading ? (
        <h4> Loading ... </h4>
      ) : (
        <FileList fileList={fileList} />
      )}
    </div>
  );
}

export default App;
```

This is the main component of our application, it wraps everything and keeps the state of the `fileList` that is shared by the `FileList` and `UploadInput` components. It also uses the `useEffect` hook to fetch the files from our API when the application is first opened.

To run the front-end app, from the `web` folder run:

```
$ npm start
```

With both the API and the React app running you can test everything together. From here you can further customize the API, I suggest you to explore the documentation listed in the [references](#references) to learn how to use other methods from the `ibm-cos-sdk`.

# References

Creating a presigned URL - [https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-presign-url](https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-presign-url)

COS Compatibility S3 API - [https://cloud.ibm.com/apidocs/cos/cos-compatibility](https://cloud.ibm.com/apidocs/cos/cos-compatibility)

Using Node.js - [https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-node](https://cloud.ibm.com/docs/cloud-object-storage?topic=cloud-object-storage-node)