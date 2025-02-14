// import React, { useState } from "react"
// import { useNavigate } from "react-router-dom"
// import axios from "axios"
// import { Form, Input, Button, Card, message, Typography, Layout } from "antd"
// import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone, MailOutlined } from "@ant-design/icons"

// const { Title } = Typography
// const { Content } = Layout

// const Register = () => {
//   const [form] = Form.useForm()
//   const [otp, setOtp] = useState("")
//   const [isOtpSent, setIsOtpSent] = useState(false)
//   const [email, setEmail] = useState("")
//   const navigate = useNavigate()

//   // JavaScript password strength validation function
//   const validatePassword = (password) => {
//     const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//     return regex.test(password)
//   }

//   const handleRegister = async (values) => {
//     const { password, confirmPassword } = values

//     // Password matching validation
//     if (password !== confirmPassword) {
//       message.error("Passwords do not match!")
//       return
//     }

//     // Password strength validation
//     if (!validatePassword(password)) {
//       message.error("Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character!")
//       return
//     }

//     try {
//       const response = await axios.post("http://127.0.0.1:5000/register", values)

//       if (response.data.status === "success") {
//         message.success("Successfully Registered! OTP sent to your email.")
//         setIsOtpSent(true)
//         setEmail(values.email) // Store email for OTP verification
//       } else {
//         message.error(response.data.message)
//       }
//     } catch (error) {
//       console.error("Error registering:", error)
//       message.error("An error occurred. Please try again.")
//     }
//   }

//   const handleVerifyOtp = async () => {
//     try {
//       const response = await axios.post("http://127.0.0.1:5000/verify-otp", { email, otp })

//       if (response.data.status === "success") {
//         message.success("OTP verified successfully! Redirecting to login...")
//         setTimeout(() => navigate("/"), 2000)
//       } else {
//         message.error("Invalid OTP. Please try again.")
//       }
//     } catch (error) {
//       console.error("OTP Verification Error:", error)
//       message.error("An error occurred. Please try again.")
//     }
//   }

//   return (
//     <Layout style={{ minHeight: "100vh" }}>
//       <Content style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
//         <Card
//           style={{ width: 400, background: "#1f1f1f", border: "1px solid #434343" }}
//           cover={
//             <img
//               alt="Register Illustration"
//               src="/images/top-view-lock-with-password-keyboard.jpg"
//               style={{ height: 200, objectFit: "cover" }}
//             />
//           }
//         >
//           <Title level={2} style={{ textAlign: "center", color: "#fff" }}>
//             {isOtpSent ? "Enter OTP" : "Register"}
//           </Title>

//           {!isOtpSent ? (
//             <Form form={form} name="register" onFinish={handleRegister} layout="vertical">
//               <Form.Item
//                 name="email"
//                 rules={[
//                   { required: true, message: "Please input your email!" },
//                   { type: "email", message: "Please enter a valid email!" },
//                 ]}
//               >
//                 <Input
//                   prefix={<MailOutlined />}
//                   placeholder="Email"
//                   onChange={(e) => setEmail(e.target.value)}
//                   style={{ background: "#141414", color: "#fff", borderColor: "#434343" }}
//                 />
//               </Form.Item>

//               <Form.Item
//                 name="password"
//                 rules={[{ required: true, message: "Please enter your password!" }]}
//               >
//                 <Input.Password
//                   prefix={<LockOutlined />}
//                   placeholder="Password"
//                   iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
//                   style={{ background: "#141414", color: "#fff", borderColor: "#434343" }}
//                 />
//               </Form.Item>

//               <Form.Item
//                 name="confirmPassword"
//                 rules={[{ required: true, message: "Please confirm your password!" }]}
//               >
//                 <Input.Password
//                   prefix={<LockOutlined />}
//                   placeholder="Confirm Password"
//                   iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
//                   style={{ background: "#141414", color: "#fff", borderColor: "#434343" }}
//                 />
//               </Form.Item>

//               <Button type="primary" htmlType="submit" block>
//                 Register
//               </Button>
//             </Form>
//           ) : (
//             <div>
//               <Input
//                 prefix={<UserOutlined />}
//                 placeholder="Enter OTP"
//                 value={otp}
//                 onChange={(e) => setOtp(e.target.value)}
//                 style={{ background: "#141414", color: "#fff", borderColor: "#434343", marginBottom: "10px" }}
//               />
//               <Button type="primary" onClick={handleVerifyOtp} block>
//                 Verify OTP
//               </Button>
//             </div>
//           )}
//         </Card>
//       </Content>
//     </Layout>
//   )
// }

// export default Register
