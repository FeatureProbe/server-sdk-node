# FeatureProbe Server Side SDK for Node.js

[![Top Language](https://img.shields.io/github/languages/top/FeatureProbe/server-sdk-node)](https://github.com/FeatureProbe/server-sdk-node/search?l=rust)
[![Coverage Status](https://coveralls.io/repos/github/FeatureProbe/server-sdk-node/badge.svg?branch=demo)](https://coveralls.io/github/FeatureProbe/server-sdk-node?branch=demo)
[![Github Star](https://img.shields.io/github/stars/FeatureProbe/server-sdk-node)](https://github.com/FeatureProbe/server-sdk-node/stargazers)
[![Apache-2.0 license](https://img.shields.io/github/license/FeatureProbe/FeatureProbe)](https://github.com/FeatureProbe/FeatureProbe/blob/demo/LICENSE)

FeatureProbe is an open source feature management service. This SDK is used to control features in Node.js programs. This
SDK is designed primarily for use in multi-user systems such as web servers and applications.

## Basic Terms

Reading the short [Basic Terms](https://github.com/FeatureProbe/FeatureProbe/blob/demo/BASIC_TERMS.md) will help to understand the code blow more easily.  [中文](https://github.com/FeatureProbe/FeatureProbe/blob/demo/BASIC_TERMS_CN.md)

## Try Out Demo Code
We provide a runnable demo code for you to understand how FeatureProbe SDK is used.

1. Start FeatureProbe Service with docker composer. [How to](https://github.com/FeatureProbe/FeatureProbe#1-starting-featureprobe-service-with-docker-compose)
2. Download this repo and run the demo program:
3. Find the Demo code in [example](https://github.com/FeatureProbe/server-sdk-node/tree/demo/example), 
do some change and run the program again.

## Step-by-Step Guide

In this guide we explain how to use feature toggles in a Node.js application using FeatureProbe.

### Step 1. Install the Node.js SDK

### Step 2. Create a FeatureProbe instance

### Step 3. Use the feature toggle

### Step 4. Unit Testing (Optional)

## Testing SDK

We have unified integration tests for all our SDKs. Integration test cases are added as submodules for each SDK repo. So
be sure to pull submodules first to get the latest integration tests before running tests.


## Contributing

We are working on continue evolving FeatureProbe core, making it flexible and easier to use.
Development of FeatureProbe happens in the open on GitHub, and we are grateful to the
community for contributing bugfixes and improvements.

Please read [CONTRIBUTING](https://github.com/FeatureProbe/featureprobe/blob/master/CONTRIBUTING.md)
for details on our code of conduct, and the process for taking part in improving FeatureProbe.