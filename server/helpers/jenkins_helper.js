import request from 'request-promise-native';
import * as configs from '../config/config';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

function triggerNewBuild({
  selectedProd,
  email,
  testname,
  kpi,
  jmxParams,
  csvParams,
  res
}) {
  var url = `${configs.jenkinsUrl}/job/${selectedProd}/buildWithParameters`;
  url = encodeURI(url);
  const headers = {
    Authorization: `${configs.jenkinsAuthHeader}`
  };
  let formData = {
    email,
    testname,
    kpi,
    ...jmxParams,
    ...csvParams
  };
  let post_options = {
    url: url,
    resolveWithFullResponse: true,
    formData: formData,
    headers: headers
  };

  request
    .post(post_options)
    .then(function(response) {
      if (response.statusCode == 201) {
        var queue_url = `${configs.jenkinsUrl}/queue/api/json`;
        queue_url = encodeURI(queue_url);

        let get_options = {
          url: queue_url,
          headers: headers
        };

        request
          .get(get_options)
          .then(response => {
            let responseJson = JSON.parse(response);
            let items = responseJson.items;
            if (items.length >= 1) {
              for (var val in items) {
                if (items[val].task.name === `${selectedProd}`) {
                  return res.status(201).send('Test is queued');
                }
              }
            }
            res.status(200).send('Test is started');
          })
          .catch(err => {
            return res.status(201).send('Test is queued');
          });
      }
    })
    .catch(err => {
      res.status(500).send(err);
    });
}

async function saveReport(reportId, selectedProd) {
  const reportRootDir = path.join(__dirname, '../../test-reports');
  const prodPath = path.join(reportRootDir, `/${selectedProd}`);
  const reportPath = path.join(prodPath, `/${reportId}`);
  const htmlPath = path.join(reportPath, '/HTMLReport');

  // create test-results directory if it does not exist (/test-results).
  if (!fs.existsSync(reportRootDir)) {
    createPath(reportRootDir);
  }

  // create the product path if it does not exists (/test-results/simple-demo).
  if (!fs.existsSync(prodPath)) {
    createPath(prodPath);
  }

  // create the report path if it does not exists (/test-results/simple-demo/19).
  if (!fs.existsSync(prodPath)) {
    createPath(reportPath);
  }

  const reportUrl = `${configs.jenkinsUrl}/job/${selectedProd}/${reportId}/HTMLReport/*zip*/HTMLReport.zip`;
  const zipContent = await getZipContent(reportUrl);

  extractZipContents(zipContent.body, reportPath);

  return { htmlPath };
}

function getZipContent(reportUrl) {
  const headers = {
    Authorization: `${configs.jenkinsAuthHeader}`
  };

  const options = {
    url: encodeURI(reportUrl),
    resolveWithFullResponse: true,
    simple: false,
    // the { encoding: null } is needed as part of the request options.
    encoding: null,
    headers
  };

  return request.get(options);
}

function extractZipContents(zipData, reportPath) {
  const zip = new AdmZip(zipData);

  zip.extractAllTo(reportPath, true);
}

function createPath(path) {
  fs.mkdirSync(path);
}

export {
  triggerNewBuild,
  saveReport
};
