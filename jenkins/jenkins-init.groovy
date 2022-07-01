#!groovy

import jenkins.model.*
import hudson.security.*
import hudson.tools.*;
import hudson.util.Secret;
import jenkins.security.s2m.AdminWhitelistRule
import net.sf.json.JSONObject
import hudson.slaves.EnvironmentVariablesNodeProperty

def instance = Jenkins.getInstance()
def user = new File("/run/secrets/jenkins-user").text.trim()
def pass = new File("/run/secrets/jenkins-pass").text.trim()

def hudsonRealm = new HudsonPrivateSecurityRealm(false)

hudsonRealm.createAccount(user, pass)
instance.setSecurityRealm(hudsonRealm)

globalNodeProperties = instance.getGlobalNodeProperties()
envVarsNodePropertyList = globalNodeProperties.getAll(EnvironmentVariablesNodeProperty.class)

def global_var = ["SEYAL_IMAGE":"", "FETCH_LOGS":"false", "IMAGE_ID":"", "SUBNET_ID":"", "VPC_ID":"", "SECURITY_GRP_ID":"", "AWS_REGION":"", "PORTAL_URL":"http://localhost:3000",
                "ANALYTICS_URL":"http://localhost:3001", "ANALYTICS_PRIVATE_IP":"host.docker.internal"]

newEnvVarsNodeProperty = null
envVars = null

//setting up the global environment variables
newEnvVarsNodeProperty = new EnvironmentVariablesNodeProperty();
globalNodeProperties.add(newEnvVarsNodeProperty)
envVars = newEnvVarsNodeProperty.getEnvVars()
for (key in global_var.keySet()) {
    envVars.put(key, global_var[key])
}

def strategy = new FullControlOnceLoggedInAuthorizationStrategy()
instance.setAuthorizationStrategy(strategy)

Jenkins.instance.getInjector().getInstance(AdminWhitelistRule.class).setMasterKillSwitch(false)

// Setting quiet period to be zero
if(!binding.hasVariable('master_settings')) {
    master_settings = [:]
}
if(!(master_settings instanceof Map)) {
    throw new Exception('master_settings must be a Map.')
}
master_settings = master_settings as JSONObject
int quiet_period = master_settings.optInt('quiet_period', 0)
if(instance.quietPeriod != quiet_period) {
    println "Setting Jenkins Quiet Period to: ${quiet_period}"
    instance.quietPeriod = quiet_period
}

def mailServer = instance.getDescriptor("hudson.tasks.Mailer")
mailServer.setSmtpHost('smtp.gmail.com')
mailServer.setUseSsl(true)
mailServer.setSmtpPort('465')
mailServer.save()

def extmailServer = instance.getDescriptor("hudson.plugins.emailext.ExtendedEmailPublisher")
extmailServer.setSmtpServer('smtp.gmail.com')
extmailServer.setSmtpUsername('< change while deploy >')
extmailServer.setSmtpPassword('< change while deploy >')
extmailServer.setUseSsl(true)
extmailServer.setSmtpPort('465')
extmailServer.save()

instance.save()

// to load html-js in iframe
System.setProperty("hudson.model.DirectoryBrowserSupport.CSP", "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' 'unsafe-inline' data:;")
