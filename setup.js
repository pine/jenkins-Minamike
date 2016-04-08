'use strict'

const fs = require('fs')
const path = require('path')

const async = require('async')
const co = require('co')
const thunkify = require('thunkify')

const resource = require('./resource.json')
const basePath = resource.path
const baseUrls = resource.base
const remoteUrls = resource.urls

const access = thunkify(fs.access)
const download = thunkify(require('download-file'))

async.eachLimit(remoteUrls, 5, (remoteUrl, cb) => {
  let localPath = remoteUrl
  baseUrls.forEach(baseUrl => {
    localPath = localPath.replace(baseUrl, '')
  })

  const localFullPath = path.resolve(basePath, localPath)
  co(function *() {
    try {
      yield access(localFullPath, fs.R_OK)
      return // skip because a target file already existed
    } catch (e) { }

    console.log(`Downloading: ${remoteUrl}`)

    const directory = path.dirname(localFullPath)
    const filename = path.basename(localFullPath)
    yield download(remoteUrl, {directory, filename})
  }).then(
    () => cb(),
    err => {
      console.error('Error: Can\'t download a target file')
      console.error(remoteUrl)
      cb(err)
    }
  )
}, err => {
  if (err) {
    process.exit(1)
  }
})
