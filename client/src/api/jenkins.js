import { get, post } from 'axios';

export const getGrafanaHost = () => {
  return get("/api/getGrafanaHost");
};

export const getAllProducts = () => {
  return get("/api/jenkins/allProducts");
};

export const createSwarm = formData => {
  return post(`/api/jenkins/createSwarm`, formData, {
    headers: {
      "content-type": "multipart/form-data"
    }
  });
};

export const getRecentSwarms = productname => {
  return post("/api/jenkins/recentSwarms", { productname });
};

export const abortBuild = selectedProd => {
  return post(`/api/jenkins/AbortBuild`, { selectedProd });
};

export const getRecentReport = productname => {
  return post("/api/jenkins/recentReport", { productname });
};

export const getLiveSwarms = () => {
  return get("/api/jenkins/liveSwarms");
};

export const getConsoleTexts = selectedProd => {
  return get("/api/jenkins/consoleText?selectedProd="+selectedProd);
}
