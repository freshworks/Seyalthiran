export const grafanaHost = process.env.NODE_ENV === 'development' ? process.env.REACT_APP_GRAFANA_HOST_URL : window.REACT_APP_GRAFANA_HOST_URL;

export function setgrafanaurl(appname, cur_time, panelid) {
  return `${grafanaHost}/d-solo/grafana_uid/seyalthiran-dashboard?orgId=1&var-data_source=InfluxDB&var-application=${appname}&var-transaction=Api%20Request%201&var-measurement_name=jmeter&var-send_interval=5&from=${cur_time}&to=now&theme=light&refresh=10s&panelId=${panelid}`;
}
