export function setgrafanaurl(grafanaHost,appname, cur_time, panelid) {
  return `${grafanaHost}/d-solo/grafana_uid/seyalthiran-dashboard?orgId=1&var-data_source=InfluxDB&var-application=${appname}&var-transaction=Api%20Request%201&var-measurement_name=jmeter&var-send_interval=5&from=${cur_time}&to=now&theme=light&refresh=10s&panelId=${panelid}`;
}
