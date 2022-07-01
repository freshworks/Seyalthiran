package seyalthiran
import groovy.xml.StreamingMarkupBuilder
import groovy.xml.XmlUtil
import groovy.io.FileType
import java.io.LineNumberReader
import java.io.FileReader
import java.nio.file.Files
import java.nio.file.Paths
import java.lang.Math

class JMXParser {
    static main(args) {
        //Args Expected
        // 1. Jmx File Name 2. Application Name 3. threadsPerMachine 4. host IP
        Splitter split = new Splitter(args[0].toString())
        split.appendConfigs(args)
        split.handleLoopforever()
        split.handleCSVpath()
        split.jmxScale(args[2].toInteger())
    }
}
class Splitter{
    // Declaring required variables
    def testFile,jmx,scaledFile,fileWriter,result
    int totalThreads=0
    Splitter(testFilename)
    {
        println '---- Analyzing JMX -----'
        testFile = new File(testFilename)
        println "Test file name: ${testFile.name}"
        scaledFile="Scaled_${testFile.name}"
        fileWriter = new FileWriter(scaledFile)
    }


    void appendConfigs(args) {
        def kpiObj = new groovy.json.JsonSlurper().parseText(System.getenv('kpi'));
        String jmxContents = testFile.text;
        def (a, b) = jmxContents.split("</TestPlan>");
        def res = new StringBuilder().append(a).append("</TestPlan>");
        String influxConfigContent = getInfluxContent(args[1].toString(), args[3].toString());
        String autoStopContent = getAutoCutConfig(kpiObj);
        def final_res = res.append(influxConfigContent).append(autoStopContent).append(b.substring('<hashTree>'.size())).toString();
        jmx = new XmlSlurper().parseText(final_res);
    }

    def getInfluxContent(applicationName,influxDbHost) {

        def bendlist = '''<hashTree>
        <BackendListener guiclass="BackendListenerGui" testclass="BackendListener" testname="Backend Listener" enabled="true">
          <elementProp name="arguments" elementType="Arguments" guiclass="ArgumentsPanel" testclass="Arguments" enabled="true">
            <collectionProp name="Arguments.arguments">
              <elementProp name="influxdbMetricsSender" elementType="Argument">
                <stringProp name="Argument.name">influxdbMetricsSender</stringProp>
                <stringProp name="Argument.value">org.apache.jmeter.visualizers.backend.influxdb.HttpMetricsSender</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="influxdbUrl" elementType="Argument">
                <stringProp name="Argument.name">influxdbUrl</stringProp>
                <stringProp name="Argument.value">http://'''<<influxDbHost<<''':8086/write?db=seyalthiran</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="application" elementType="Argument">
                <stringProp name="Argument.name">application</stringProp>
                <stringProp name="Argument.value">'''<<applicationName<<'''</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="measurement" elementType="Argument">
                <stringProp name="Argument.name">measurement</stringProp>
                <stringProp name="Argument.value">jmeter</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="summaryOnly" elementType="Argument">
                <stringProp name="Argument.name">summaryOnly</stringProp>
                <stringProp name="Argument.value">false</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="samplersRegex" elementType="Argument">
                <stringProp name="Argument.name">samplersRegex</stringProp>
                <stringProp name="Argument.value">.*</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="percentiles" elementType="Argument">
                <stringProp name="Argument.name">percentiles</stringProp>
                <stringProp name="Argument.value">90;95;99</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="testTitle" elementType="Argument">
                <stringProp name="Argument.name">testTitle</stringProp>
                <stringProp name="Argument.value">Test name</stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
              <elementProp name="eventTags" elementType="Argument">
                <stringProp name="Argument.name">eventTags</stringProp>
                <stringProp name="Argument.value"></stringProp>
                <stringProp name="Argument.metadata">=</stringProp>
              </elementProp>
            </collectionProp>
          </elementProp>
          <stringProp name="classname">org.apache.jmeter.visualizers.backend.influxdb.InfluxdbBackendListenerClient</stringProp>
        </BackendListener>
        <hashTree/>'''
        return bendlist;
    }

    // Subroutine to handle loopever without test time
    void handleLoopforever(){
        boolean needScheduleOverwrite = false;
        boolean isLoopForever = false;
        // Find all Thread Groups
        jmx.'**'.findAll{
            node-> node.name()=='ThreadGroup'
        }.each(){
            it.elementProp.each() {
                it.intProp.each() {
                    if(it.@name=='LoopController.loops')
                    {
                        isLoopForever = true;
                    }
                }
            }
            if(isLoopForever) {
                it.boolProp.each(){
                   if(it.@name=='ThreadGroup.scheduler' && it!='true')
                    {
                        needScheduleOverwrite=true;
                        it.replaceNode{
                            stringProp(name:'ThreadGroup.scheduler',true)
                        }
                    }
                }
            }
            it.stringProp.each(){
                if(needScheduleOverwrite) {
                   if(it.@name=='ThreadGroup.duration')
                    {
                        it.replaceNode{
                            stringProp(name:'ThreadGroup.duration',300)
                        }
                    }
                }
            }
        }
    }

    // Subroutine csv path with absolute path
    void handleCSVpath(){
        jmx.'**'.findAll{
            node-> node.name()=='CSVDataSet'
        }.each(){
            it.stringProp.each() {
                    if(it.@name=='filename')
                    {
                        it.replaceNode{
                            stringProp(name:'filename',it.toString().replaceFirst(/^.*[\\/]/, ''))
                        }
                    }
            }
        }
    }


    // Method to scale JMX
    void jmxScale(threadsPerMachine)
    {
        int divFactor;
        jmx.'**'.findAll{
                node-> node.name()=='elementProp' && node.@name=='TestPlan.user_defined_variables'
            }.each(){
                it.'**'.findAll{
                    node->node.name()=='elementProp' && node.@name=='sp_totalUsers'
                }.each(){
                    it.stringProp.each(){
                        if(it.@name=='Argument.value'){
                            totalThreads = it.toInteger()
                            divFactor = (Math.ceil(totalThreads/threadsPerMachine)).toInteger()
                            if(divFactor>1)
                            {
                                println 'Scaling JMX with factor '+divFactor
                                it.replaceNode{
                                    stringProp(name:'Argument.value',(Math.ceil(totalThreads/divFactor).toInteger()))
                                }
                            }
                        }
                    }
                }
            }
        if(divFactor>1)
        {
            result = new StreamingMarkupBuilder().bind { mkp.yield jmx }
            XmlUtil.serialize(result, fileWriter)
            println "Created:  ${scaledFile}"
            fileWriter.close()
            csvSplit(divFactor)
        }
        else{
              println 'Scaling JMX with factor 1'
              println 'Renaming JMX'
              result = new StreamingMarkupBuilder().bind { mkp.yield jmx }
              XmlUtil.serialize(result, fileWriter)
              println "Created:  ${scaledFile}"
              fileWriter.close()
              def list = getCSVfiles()
              if(list.size() > 0)
              {
                println 'Moving CSVs to 1/'
                new File("1").mkdir()
                list.each{
                    Files.copy(Paths.get(it.path), Paths.get("1/${it.path}"))
                }
              }
        }
    }

    // Method to Split CSV
    void csvSplit(divFactor)
    {
        println 'Splitting CSV with factor '+divFactor
        File dataFile
        FileReader fr
        LineNumberReader lnr
        def list = getCSVfiles()
        if(list.size() > 0){
            for(int i=1;i<=divFactor;i++)
            {
                // Create sub directory to hold data files each slaves
                new File("$i").mkdir()
            }
            list.each {
                dataFile = new File(it.path)
                fr = new FileReader(dataFile)
                lnr = new LineNumberReader(fr)
                def total_lines = 0
                while (lnr.readLine() != null){
    	        	total_lines++
    	        }
                System.out.println("Total number of lines for ${dataFile.name} : " + total_lines)
    	        lnr.close()
                int lines_per_csv = (total_lines-1)/divFactor
                println "Per CSV to contain ${lines_per_csv}"
                int i=0
                int fileNumber=1
                def firstLine
                File fileToWrite = new File(fileNumber + '/' + dataFile.name)
                if (lines_per_csv == 0) {
                    dataFile.eachLine {line->
                        if("$line" != null) {
                            for(int k=1;k<=divFactor;k++) {
                                fileToWrite = new File(k + '/' +  dataFile.name)
                                fileToWrite << "$line\r\n"
                            }
                        }
                    }
                }
                else{
                    dataFile.eachLine{line->
                        if(i>lines_per_csv && "$line" != null && fileNumber<divFactor){
                            i=1
                            fileNumber+=1
                            fileToWrite = new File(fileNumber + '/' +  dataFile.name)
                            fileToWrite << "$firstLine\r\n"
                        }
                        if(i==0) {firstLine = "$line"}
                        i=i+1
                        fileToWrite << ("$line\r\n")
                    }
                }
            }
        }
        else
        {
            println "No CSV's Submitted"
        }
    }

    def getAutoCutConfig(kpiObj)
    {
        def content = '', resp_time = 0, err_rate = 0;
        def error_rate = kpiObj["err_rate"]["value"];
        def response_time = kpiObj["response_time"]["value"];
        def ErrorAutoStop = kpiObj["err_rate"]["autoStop"].toBoolean();
        def ResponseAutoStop = kpiObj["response_time"]["autoStop"].toBoolean();

        if( ErrorAutoStop ){
            err_rate = error_rate;
        }
        if( ResponseAutoStop ){
            resp_time = (int) (Double.parseDouble(response_time.toString())*1000);
        }
        if(ErrorAutoStop || ResponseAutoStop) {
            content = '''<kg.apc.jmeter.reporters.AutoStop guiclass="kg.apc.jmeter.reporters.AutoStopGui" testclass="kg.apc.jmeter.reporters.AutoStop" testname="jp@gc - AutoStop Listener" enabled="true">
                <stringProp name="avg_response_time">'''<<resp_time<<'''</stringProp>
                <stringProp name="avg_response_time_length">60</stringProp>
                <stringProp name="error_rate">'''<<err_rate<<'''</stringProp>
                <stringProp name="error_rate_length">60</stringProp>
            </kg.apc.jmeter.reporters.AutoStop>
            <hashTree/>'''
        }

        println "Response and error rate is:  ${response_time} ${error_rate}. Calculated response time is ${resp_time}"

        return content;
    }

    def getCSVfiles()
    {
        def dir = new File(".")
        def list = []
        dir.eachFileRecurse (FileType.FILES) { file ->
            if(file.name.matches("^[a-zA-Z0-9_]*.csv\$"))
                list << file
        }
        return list
    }
}
