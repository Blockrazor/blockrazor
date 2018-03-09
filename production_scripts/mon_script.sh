#/bin/bash

b=$(cat /tmp/info.txt)
c=$(ls -la ~/blockrazor/blockrazor/ |grep package.json | awk '{print $8}')
echo $b $c
if [ "$b" == "$c" ]; then
        echo "No changes"
else
        echo "changes detected"
        echo $c> /tmp/blockrazor.packages
        echo "Version Updated"
        #sh stop_meteor.sh
        #sh start_meteor.sh
fi
