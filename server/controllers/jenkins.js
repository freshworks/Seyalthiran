import express from 'express';
import { get } from 'axios';
import { saveReport, triggerNewBuild } from '../helpers/jenkins_helper';
import * as configs from '../config/config';
import request from 'request-promise-native';
import fs from 'fs';

let router = express.Router();
var parseString = require('xml2js').parseString;

router.get('/allProducts', (req, res) => {
  let jobsUrl = `${configs.jenkinsUrlAsJson}&tree=jobs[name]`;
  jobsUrl = encodeURI(jobsUrl);
  get(jobsUrl, {
    headers: {
      Authorization: `${configs.jenkinsAuthHeader}`
    }
  })
    .then(response => {
      let jobList = response.data.jobs;
      let productList = jobList.map(({ name }) => ({
        text: name,
        value: name
      }));
      res.status(200).send(productList);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

router.get('/consoleText', (req, res) => {
  let { selectedProd } = req.query;
  let consoleUrl = `${configs.jenkinsUrl}/job/${selectedProd}/lastBuild/consoleText`;
  console.log(consoleUrl);
  consoleUrl = encodeURI(consoleUrl);
  get(consoleUrl, {
    headers: {
      Authorization: `${configs.jenkinsAuthHeader}`
    }
  })
    .then(response => {
      res.status(200).send(response.data);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

router.post('/recentSwarms', (req, res) => {
  let { productname } = req.body;
  let NoRecents = 10;
  let testNamesUrl = `${configs.jenkinsUrlAsXml}&tree=jobs[name,builds[actions[parameters[name,value]],timestamp,number]]&xpath=/hudson/job[name="${productname}"]/build[position()<=${NoRecents}]/action/parameter[name="testname"]/value|/hudson/job[name="${productname}"]/build[position()<=${NoRecents}]/timestamp|/hudson/job[name="${productname}"]/build[position()<=${NoRecents}]/number&wrapper=recentswarms`;
  testNamesUrl = encodeURI(testNamesUrl);
  get(testNamesUrl, {
    headers: {
      Authorization: `${configs.jenkinsAuthHeader}`
    }
  })
    .then(response => {
      parseString(response.data, (err, result) => {
        res.status(200).send(result);
      });
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

router.post('/createSwarm', (req, res) => {
  let { email, testname, selectedProd, kpi } = req.body;

  let jmxParams = {};
  let csvParams = {};

  req.files.map(file => {
    if (file.fieldname === 'jmxfile') {
      jmxParams[`${file.fieldname}`] = {
        value: file.buffer,
        options: {
          filename: file.originalname
        }
      };
    }
    if (file.fieldname.startsWith('csvfile')) {
      csvParams[`${file.fieldname}`] = {
        value: file.buffer,
        options: {
          filename: file.originalname
        }
      };
    }
  });

  //To-Do insert into tests table
  triggerNewBuild({
    selectedProd,
    email,
    testname,
    kpi,
    jmxParams,
    csvParams,
    res
  });
});

router.post('/abortBuild', (req, res) => {
  let { selectedProd } = req.body;
  const CurrentBuildNumberUrl = `${configs.jenkinsUrl}/job/${selectedProd}/lastBuild/buildNumber`;
  console.log(CurrentBuildNumberUrl);
  let CurrentBuildNumber;
  get(CurrentBuildNumberUrl, {
    headers: {
      Authorization: `${configs.jenkinsAuthHeader}`
    }
  }).then(response => {
    CurrentBuildNumber = response.data;
    console.log(CurrentBuildNumber);
    const AbortCurrentBuildUrl = `${configs.jenkinsUrl}/job/${selectedProd}/${CurrentBuildNumber}/stop`;
    console.log(AbortCurrentBuildUrl);
    const headers = {
      Authorization: `${configs.jenkinsAuthHeader}`
    };
    let post_options = {
      url: encodeURI(AbortCurrentBuildUrl),
      resolveWithFullResponse: true,
      simple: false,
      headers: headers
    };

    request
      .post(post_options)
      .then(() => {
        res.status(200).send('Aborted');
      })
      .catch(function(err) {
        console.log(err);
        res.status(500).send('ISE');
      });
  });
});

router.post('/recentReport', (req, res) => {
  let { productname } = req.body;
  const CurrentBuildNumberUrl = `${configs.jenkinsUrl}/job/${productname}/lastBuild/buildNumber`;
  const headers = {
    Authorization: `${configs.jenkinsAuthHeader}`
  };

  let post_options = {
    url: encodeURI(CurrentBuildNumberUrl),
    resolveWithFullResponse: true,
    simple: false,
    headers: headers
  };

  request
    .post(post_options)
    .then(response => {
      res.status(200).send(response.body);
    })
    .catch(function(err) {
      res.status(500).send(err);
    });
});

router.get('/liveSwarms', (req, res) => {
  const LiveSwarmUrl = `${configs.jenkinsUrlAsForSwarms}`;
  const headers = {
    Authorization: `${configs.jenkinsAuthHeader}`
  };

  let post_options = {
    url: encodeURI(LiveSwarmUrl),
    resolveWithFullResponse: true,
    simple: false,
    headers: headers
  };

  request
    .post(post_options)
    .then(response => {
      let jobList = JSON.parse(response.body).jobs;
      let result = [];
      jobList.forEach(job => {
        if(job.color && job.color.includes('anime')) {
          result.push({text: job.name , value: job.name});
        }
      })
      res.status(200).send(result);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});

router.get('/report/:selected_prod/:report_id', async (req, res) => {
  const reportId = req.params.report_id;
  const selectedProd = req.params.selected_prod;
  const routePath = `report/${selectedProd}/${reportId}`;

  try {
    const testReport = await saveReport(reportId, selectedProd);

    if (fs.existsSync(testReport.htmlPath)) {
      router.use(`/${routePath}`, express.static(testReport.htmlPath));

      return res.send(`/api/jenkins/${routePath}/index.html`);
    }

    return res.send(500).send('Something went wrong');
  }
  catch (error) {
    console.error(error);
    res.status(500).send(error);
  }
});

export default router;
