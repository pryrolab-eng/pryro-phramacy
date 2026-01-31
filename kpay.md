Kpay
Api Developer's Guide
Contents
Get started .................................................................................................................................................... 2
Introduction .............................................................................................................................................. 2

Authentication .............................................................................................................................................. 2
Supported payment methods ....................................................................................................................... 3
Check transaction status ............................................................................................................................... 7
KPay error / return code ............................................................................................................................... 8
Bank codes .................................................................................................................................................... 8
Get started
Introduction
Item Value
Live pay.esicia.rw
Sandbox pay.esicia.com
Port 443
Protocol HTTPS
Authentication Basic authorization
Administrator Page TBA

Authentication
API access is granted by the use of the Basic Authorization Header.
In your request, add the Authorization Basic HTTP header.
CURL EXAMPLE
curl --user name:password https://pay.esicia.com/
The system uses also IP whitelisting, the client need to submit a list of IPs where his application will
be sending the request from.
Supported payment methods
For now the following payment methods are supported
MTN Mobile Money
Airtel Money
Visa Card
MasterCard
Spenn
SmartCash
Payment request
To send a payment request to a mobile number or other payment method:
POST data are sent as json
Parameter Severity Type Description
action Required string pay; checkstatus
msisdn Required string The mobile phone number starting with country code and no +
sign. Also referred to sometimes as MSISDN.
email Required String Email of the paying client
details Required string Details of the payment to do
refid Required string Payment reference from your system (unique)
amount Required integer The amount of the payment to do (in RWF)
currency String Will be RWF if not set (supported are RWF and USD)
cname Required string The name of the person paying
cnumber Required String Customer number at the Payment processor Level
pmethod Required string The payment method (cc Credit Card, momo – mobile money
bank – for bank payment, spenn for SPENN, smartcash)
retailerid Required String The unique retailer ID
returl Required String Return url for postback of the asynchronous response
(sometimes referred as webhook)
redirecturl Required String Redirection url after payment
bankid Required String The id of the Financial Institution used in payment (refer to
table bank codes)
logourl Optional String url to the logo image to be used on card checkout page

In case of a successful payment request (awaiting to be paid) a retcode = 0 is returned.
Request body
{"msisdn":" 0783300000 ","details":"order","refid":"15947234071471114","amount"
:4200,"currency":"RWF","email":"user@user.rw","cname":"CUSTOMER
NAME","cnumber":" 123456789 ","pmethod":"momo","retailerid":"02","returl":"http
s://iduka.rw/api/paymentack","redirecturl":"https://www.iduka.rw","bankid":"
30"}
Response
Data
Description
{"reply":"PENDING","url":"https://pay.esicia.com/checkout/A12343983489","succ
ess":1,"authkey":"m43snbf9oivnmersqh6mn1lbh5","tid":"E6974831594723691","refi
d":" 15947234071471114 ","retcode":0}
Some payments are automatically processed, in that case the system will immediately send a
response of success
Response
{"tid":"E6974821594723662","refid":" 15947234071471114 ","momtransactionid":"
85640192","statusdesc":"SUCCESSFUL","statusid":"01","retcode":0}
Additional parameters can be added based on method of payment (such as masked card, etc)
Errors
If something terrible were to happen. We will send back a neat array of error codes and descriptions.
Test cards
If something terrible were to happen. We will send back a neat array of error codes and descriptions.
Card Number Card Type
5101 1800 0000 0007 Commercial Credit
2222 4000 7000 0005 Commercial Debit
5577 0000 5577 0004 Consumer
5136 3333 3333 3335 Consumer
5585 5585 5585 5583 Consumer
5555 4444 3333 1111 Consumer
2222 4107 4036 0010 Corporate
5555 5555 5555 4444 Corporate
2222 4107 0000 0002 Corporate Credit
2222 4000 1000 0008 Credit
2223 0000 4841 0010 Credit
2222 4000 6000 0007 Debit
2223 5204 4356 0010 Debit
5500 0000 0000 0004 Debit
2222 4000 3000 0004 Fleet Credit
6771 7980 2500 0004 Mastercard
5100 0600 0000 0002 Premium Credit
5100 7050 0000 0002 Premium Debit

5103 2219 1119 9245 Prepaid

Visa cards
Card Number Card Type
4988 4388 4388 4305 Classic
4166 6766 6766 6746 Classic
4646 4646 4646 4644 Classic
4000 6200 0000 0007 Commercial Credit
4000 0600 0000 0006 Commercial Debit
4293 1891 0000 0008 Commercial Premium Credit
4988 0800 0000 0000 Commercial Premium Debit
4111 1111 1111 1111 Consumer
4444 3333 2222 1111 Corporate
4001 5900 0000 0001 Corporate Credit
4000 1800 0000 0002 Corporate Debit
4000 0200 0000 0000 Credit
4000 1600 0000 0004 Debit
4002 6900 0000 0008 Debit
4400 0000 0000 0008 Debit
4484 6000 0000 0004 Fleet Credit
4607 0000 0000 0009 Fleet Debit
4977 9494 9494 9497 Gold
4000 6400 0000 0005 Premium Credit
4003 5500 0000 0003 Premium Credit
4000 7600 0000 0001 Premium Debit
4017 3400 0000 0003 Premium Debit
4005 5190 0000 0006 Purchasing Credit
4131 8400 0000 0003 Purchasing Debit
4035 5010 0000 000 8 Visa
4151 5000 0000 0008 Visa Credit
4571 0000 0000 0001 Visa Dankort
4199 3500 0000 0002 Visa Proprietary

Response
{"reply":"TARGET_AUTHORIZATION_ERROR","url":"
","success":0,"authkey":"rttdr2vr1hrdho853nfuvdkq01","tid":"E
","refid":"15947234071471114","retcode":606}
Post back asynchronous
In order to get the payment confirmation, our API sends the reply in an asynchronous mode. The
client needs to have setup a listener to which we will be posting responses as we get payments
information.
Successful payment case of mobile money
Success payment
{
"tid":"A441489693051",
"refid":"1489693046",
"momtransactionid":"616730887",
“payaccount”:” 0783300000 ”,
"statusid":"01",
"statusdesc":"Successfully processed transaction."
}
Parameter Type Description
tid string K-Pay internal payment reference number
refid string Payment reference from your system (unique)
momtransactionid String Transaction ID from the concerned financial institution
statusid string 01: successful ; 02: Failed
statusdesc String Details of transaction status
payaccount String Bank account / mobile number used to pay
Failed payment
{
"tid":"A2431476355795",
"refid":"1476293424",
"momtransactionid":"",
"statusid":"682",
"statusdesc":"An internal error caused the operation to fail"
}
Response expected
{
"tid":"A441489693051",
"refid":"1489693046",
"reply":"OK"
}
Note that statusid 01 is a complete transaction while any other value is the error code from mobile
money.
Successful payment case of visa / mastercard
In case of Visa / mastercard payments, the client is redirected to the redirect url with the response sent
to return url – your application has to read status of transaction in redirect url
Check transaction status
The client can at any time check the status of a transaction by using either internal reference and / or
external refid.
request
user can send either TID or refid; action is mandatory and always has value checkstatus
{
"tid":"A441489693051",
"refid":"1489693046",
"action":"checkstatus",
}
Response
Is same as data in postback
{
"tid":"A2431476355795",
"refid":"1476293424",
"momtransactionid":"",
"statusid":" 02 ",
"statusdesc":"An internal error caused the operation to fail"
}
Transaction not found
{"tid":"",
"refid":"",
"momtransactionid":"",
"statusid":" 611 ",
"statusdesc":"Transaction not found"
}
We always recommend to rely on check status rather than post back data
KPay error / return code
Codes that represent message status retcode (payment request) and statusid (postback).
Id Description
0 No error. Transaction being processed
01 Successful payment
02 Payment failed
03 Pending transaction
401 Missing authentication header
500 Non HTTPS request
600 Invalid username / password combination
601 Invalid remote user
602 Location / IP not whitelisted
603 Empty parameter. - missing required parameters
604 Unknown retailer
605 Retailer not enabled
606 Error processing
607 Failed mobile money transaction
608 Used ref id – error uniqueness
609 Unknown Payment method
610 Unknown or not enabled Financial institution
611 Transaction not found

Bank codes
bankid BANK NAME SHORT NAME
010 INVESTMENT AND MORTGAGE BANK IMBANK RWANDA
040 BANQUE DE KIGALI BK
070 GUARANTY TRUST BANK (RWANDA) GTBANK RWANDA
100 ECOBANK RWANDA ECOBANK
115 ACCESS RWANDA ACCESS
130 COMPAGNIE GENERALE DE BANQUES COGEBANQUE
145 URWEGO OPPORTUNITY BANK UOB
160 KENYA COMMERCIAL BANK KCB RWANDA
192 EQUITY BANK EQUITY
400 BANQUE POPULAIRE DU RWANDA BPR
750 BANQUE RWANDAISE DE DEVELOPEMENT BRD
800 ZIGAMA CREDIT AND SAVINGS SCHEME ZIGAMA
900 BANK OF AFRICA RWANDA BOA RWANDA
950 UNGUKA BANK UNGUKA
951 BANQUE NATIONALE DU RWANDA BNR
63510 MTN MOBILE MONEY MTN MOMO
63514 AIRTEL MONEY AIRTEL MONEY
000 VISA - MASTERCARD CARDS
63501 MOBICASH MOBICASH
63502 SPENN SPENN
