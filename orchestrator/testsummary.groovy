import hudson.model.*
import groovy.json.*
import groovy.xml.MarkupBuilder
import groovy.time.*
import java.text.*
import java.util.Date
import java.util.TimeZone

println 'Generating summary report seyalthiran email report'

def JOB_NAME = System.getenv('JOB_NAME')
def BUILD_NUMBER = System.getenv('BUILD_NUMBER')
def TESTNAME = System.getenv('testname')
def KPI = System.getenv('kpi')
def PORTAL_URL = System.getenv('PORTAL_URL')
def ANALYTICS_URL = System.getenv('ANALYTICS_URL')
def file1 = new File("${BUILD_NUMBER}/summary.html")
def html_file = new File("${BUILD_NUMBER}/report/index.html")
def file = new File("${BUILD_NUMBER}/report/content/js/dashboard.js")

//parse kpi
def kpiObj =new JsonSlurper().parseText(KPI)

println KPI
println kpiObj.response_time
println kpiObj.err_rate

String data= file.filterLine { line ->
    line.contains('statisticsTable')
}

String summary = data.substring(data.indexOf('"items"'),data.indexOf('}, function'))
String datapoints = summary.substring(summary.indexOf('[{"data":'),summary.length())

datapoints = datapoints.replace("Infinity", "\"Infinity\"")
datapoints = datapoints.replace("NaN", "\"NaN\"")

def list = new JsonSlurper().parseText(datapoints)
html_file.eachLine { line, lineNumber ->
    if(line.contains("Start Time")) {
        startlineNum = lineNumber
    }
}
String start_time = html_file.readLines().get(startlineNum).minus("<td>").minus("</td>").minus("\"").minus("\"")

html_file.eachLine { line, lineNumber ->
    if(line.contains("End Time")) {
        endlineNum = lineNumber
    }
}
String end_time = html_file.readLines().get(endlineNum).minus("<td>").minus("</td>").minus("\"").minus("\"")

// Trim the string
time_start = start_time.trim()
time_end = end_time.trim()

print "DATE Format in Jmeter output\n"
println time_start
println time_end

Date date_start;
Date date_end;
try {
    SimpleDateFormat format = new SimpleDateFormat("MM/dd/yy hh:mm aaa");
    format.setTimeZone(TimeZone.getTimeZone("IST"));
    date_start = format.parse(time_start);
    date_end = format.parse(time_end);
    println "Date in IST: "
    println date_start;
    println date_end;
} catch (ParseException e) {
    e.printStackTrace();
}

// Convert to milliseconds
milli_start = date_start.getTime()
milli_end = date_end.getTime()

// In order to avoid difference in seconds
milli_start = milli_start - 60000
milli_end = milli_end + 60000

println "Milli Start: ${milli_start}"
println "Milli End: ${milli_end}"


TimeDuration duration = TimeCategory.minus(date_end,date_start)
println duration
def min_duration
def hr_duration
if ( duration.hours != 0 )
{
    hr_duration = duration.hours + " hour(s)"
}

if (( duration.hours == 0 ) || ( duration.minutes != 0 ))
{
    if ( duration.minutes == 0 || duration.minutes == null )
    {
        min_duration = "less than 1 minute"
    }
    else if ( duration.minutes == 1 )
    {
        min_duration = "1 minute"
    }
    else
    {
        min_duration = duration.minutes + " minutes"
    }
}
if (hr_duration && (min_duration != null ))
{
  test_duration = hr_duration + " " + min_duration
}
else if (hr_duration && (min_duration == null ))
{
    test_duration = hr_duration
}
else
{
    test_duration = min_duration
}
println test_duration

def sb = new StringWriter()
def html = new MarkupBuilder(sb)
html.doubleQuotes = true
html.expandEmptyElements = true
html.omitEmptyAttributes = false
html.omitNullAttributes = false
html.html {
    head {
      title ("Seyalthiran Summary report")
    }
    body {
        p {
            mkp.yieldUnescaped "Hello,<br><br>Here is the seyalthiran report of the test run: "
            strong "${JOB_NAME}: ${TESTNAME}"
        }
      	p {
            mkp.yield "This test ran for a"
            strong "duration of ${test_duration}"
            mkp.yield " which started at ${date_start}"
        }
        if (!(kpiObj.response_time.value == null && kpiObj.err_rate.value == null)) {
            p {
                mkp.yield "Key Performance Indicators : "
                strong "Response time : ${kpiObj.response_time.value} "
                mkp.yield "&"
                strong " Error percentage : ${kpiObj.err_rate.value}"
            }
        }
        u  { strong "Application Metrics:" }
        p { mkp.yield "\n" }
        table (border: 1){
            tr {
                    th ('Transaction')
                    th ('#Transactions')
                    th ('Error %')
                    th ('Average response time (s)')
                }
            list.each {
                def value=it
                def err_val = (Math.round(value.data[3] * 100) / 100)
                def res_val = (Math.round((value.data[4]/1000) * 100) / 100)

                def res_time = (kpiObj.response_time.value!=null)? Double.parseDouble(kpiObj.response_time.value.toString()):null
                def error_rate = (kpiObj.err_rate.value!=null)? Double.parseDouble(kpiObj.err_rate.value.toString()):null

                if ( (res_time>=0 && error_rate>=0) && ((res_val >= res_time) || (err_val > error_rate)) ) {
                    tr ('bgcolor':'ff6363') {
                        td (value.data[0])
                        td (value.data[1])
                        td (err_val)
                        td (res_val)
                    }
                }
                else {
                    tr {
                        td (value.data[0])
                        td (value.data[1])
                        td (err_val)
                        td (res_val)
                    }
                }
            }
        }
        p {
    			mkp.yield "Click to see "
    			a(href:"${PORTAL_URL}/swarmReports/${JOB_NAME}/${BUILD_NUMBER}", "detailed report")
                mkp.yield " and"
                a(href:"${ANALYTICS_URL}/d/grafana_uid/seyalthiran-dashboard?orgId=1&from=${milli_start}&to=${milli_end}&var-data_source=InfluxDB&var-application=${JOB_NAME}&var-measurement_name=jmeter&var-send_interval=5", "Graphical Report")
		}
        p { mkp.yield "\n" }
    }
}
println sb.toString()
file1.write sb.toString()
