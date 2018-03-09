############################################
#/bin/bash

netstat -tulpn | grep 3000 > /tmp/t1.txt
if [ $? -eq 1 ]; then
        echo "Meteor is not running"

else
        id=$(cat /tmp/t1.txt |  awk '{print $7}' | grep -o "^[0-9]*")
        echo "PID of meteor : "$id
        echo "Killing the meteor ...."
        kill $id
        echo "Meteor has been killed ...."
        meteor npm install

fi
