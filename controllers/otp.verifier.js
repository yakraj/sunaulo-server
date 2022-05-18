
var MobileOtp = []

const otpsender = () => (req, res) => {
	const {mobile} = req.body;
	var OtpFinder = MobileOtp.find(x => x.mobile === mobile)
var val = Math.floor(1000 + Math.random() * 9000);


	if(OtpFinder){
MobileOtp =MobileOtp.filter(x => x.mobile !== mobile);
MobileOtp = [...MobileOtp, {mobile: mobile,otp:val}]
	}
	else{	 MobileOtp = [...MobileOtp, {mobile: mobile,otp:val}]}
	// res.json('we have successfully send otp to this number' + mobile)

console.log(MobileOtp)
res.json('successfully send otp')
} 



const otpVerification =() => (req,res) => {
const {mobile,otp} = req.body;

// console.log(mobile,otp)
var OtpFinder = MobileOtp.find(x => x.mobile == mobile);
// console.log(OtpFinder)
if(OtpFinder){ if(OtpFinder.otp == otp){
	console.log(OtpFinder)
	res.json(true)
	MobileOtp =MobileOtp.filter(x => x.mobile !== mobile);
}else{
	res.json(false)

}}else{ res.json('there is no registered number')}

}


module.exports = {
	otpsender:otpsender,
	otpVerification:otpVerification
}