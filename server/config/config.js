export const jenkinsUrl = process.env.REACT_APP_JENKINS_URL;

export const jenkinsUrlAsJson = `${jenkinsUrl}/api/json?pretty=true`;

export const jenkinsUrlAsXml = `${jenkinsUrl}/api/xml?pretty=true`;

export const jenkinsUrlAsForSwarms = `${jenkinsUrl}/api/json?tree=jobs[name,url,color]&xpath=/hudson/job[ends-with(color/text(),%22_anime%22)]&wrapper=jobs`;

export const jenkinsAuthHeader = process.env.AUTH_TOKEN;
