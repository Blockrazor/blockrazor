#Global Helpers#

######Relative Time
Turns '1518905233736.0' into '5 mins ago'

{{relativeTime dateTime}}

######Parse \n to <br />
Turns 'Hello\nWorld' into 'Hello<br />World'

{{{nlToBr text}}}

*Notice the three {{{ text }}}, this is required to parse html in Blaze*


######Profile Picture
Return the users profile picture as a thumbnail or the original size (default to large if no size is defined)

{{profilePicture small}}

*or*

{{profilePicture large}}
