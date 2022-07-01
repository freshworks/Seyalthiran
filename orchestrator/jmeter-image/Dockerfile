FROM openjdk:8-alpine

LABEL maintainer="Seyalthiran"

ENV JMETER_VERSION apache-jmeter-5.4.3
ENV JMETER_HOME /opt/$JMETER_VERSION
ENV PATH $PATH:$JMETER_HOME/bin
ENV CMDRUNNER_VERSION 2.2
ENV PLUGINMGR_VERSION 1.4

# Install the required tools for JMeter
RUN apk add --update --no-cache \
  curl \
  openssh-client \
  tzdata \
  fontconfig \
  ttf-dejavu

# Change Timezone to IST
RUN ln -sf /usr/share/zoneinfo/Asia/Kolkata /etc/localtime
RUN echo "Asia/Kolkata" >  /etc/timezone

WORKDIR /opt

# install JMeter and the JMeter Plugins Manager
RUN curl -O https://archive.apache.org/dist/jmeter/binaries/$JMETER_VERSION.tgz \
  && tar -xvf $JMETER_VERSION.tgz \
  && rm $JMETER_VERSION.tgz \
  && rm -rf $JMETER_VERSION/docs $JMETER_VERSION/printable_docs \
  && cd $JMETER_HOME/lib \
  && curl -O https://repo1.maven.org/maven2/kg/apc/cmdrunner/$CMDRUNNER_VERSION/cmdrunner-$CMDRUNNER_VERSION.jar \
  && cd $JMETER_HOME/lib/ext \
  && curl -O https://repo1.maven.org/maven2/kg/apc/jmeter-plugins-manager/$PLUGINMGR_VERSION/jmeter-plugins-manager-$PLUGINMGR_VERSION.jar \
  && java -cp jmeter-plugins-manager-$PLUGINMGR_VERSION.jar org.jmeterplugins.repository.PluginManagerCMDInstaller

# Customising Jmeter for Seyalthiran
COPY ./jmeter $JMETER_VERSION

# copy our entrypoint
COPY entrypoint.sh /opt/jmeter/

#Permission for entrypoint
RUN chmod 777 /opt/jmeter/entrypoint.sh

# install required plugins
RUN PluginsManagerCMD.sh install jpgc-prmctl,jpgc-autostop \
  && sleep 2 \
  && PluginsManagerCMD.sh status

WORKDIR /tmp

# default command in the entrypoint is 'swarm'
ENTRYPOINT ["/opt/jmeter/entrypoint.sh"]
CMD ["swarm"]
