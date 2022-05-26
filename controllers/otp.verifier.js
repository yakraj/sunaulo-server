var MobileOtp = [];

const otpsender = (axios) => (req, res) => {
  const { mobile } = req.body;
  var OtpFinder = MobileOtp.find((x) => x.mobile === mobile);
  var val = Math.floor(1000 + Math.random() * 9000);

  if (OtpFinder) {
    MobileOtp = MobileOtp.filter((x) => x.mobile !== mobile);
    MobileOtp = [...MobileOtp, { mobile: mobile, otp: val }];
  } else {
    MobileOtp = [...MobileOtp, { mobile: mobile, otp: val }];
  }
  // res.json('we have successfully send otp to this number' + mobile)
console.log(MobileOtp);
  axios({
    method: "get",
    url: `https://www.fast2sms.com/dev/bulkV2?authorization=KLF32bSuRJ9eBpwsZdQ4fWaGV6HhDtog7CTY5UjlEiX0mIyvnc1k9HQbtMX6zpi4cIdgaqBNxG7j5sYm&variables_values=${MobileOtp[0].otp}&route=otp&numbers=${mobile}`,
    // responseType: 'stream'
  }).then(function (response) {
    // response.data.pipe(fs.createWriteStream('ada_lovelace.jpg'))
    res.json("successfully send otp");
  });
};

const otpVerification = () => (req, res) => {
  const { mobile, otp } = req.body;

  // console.log(mobile,otp)
  var OtpFinder = MobileOtp.find((x) => x.mobile == mobile);
  // console.log(OtpFinder)
  if (OtpFinder) {
    if (OtpFinder.otp == otp) {
      console.log(OtpFinder);
      res.json(true);
      MobileOtp = MobileOtp.filter((x) => x.mobile !== mobile);
    } else {
      res.json(false);
    }
  } else {
    res.json("there is no registered number");
  }
};

module.exports = {
  otpsender: otpsender,
  otpVerification: otpVerification,
};
