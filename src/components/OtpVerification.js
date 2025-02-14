import React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import axios from "axios"
import { Form, Input, Button, Card, message, Typography, Layout } from "antd"

const { Title } = Typography
const { Content } = Layout

const OtpVerification = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email

  const handleOtpSubmit = async (values) => {
    try {
      const response = await axios.post("http://127.0.0.1:5000/verify-otp", { email, otp: values.otp })

      if (response.data.status === "success") {
        message.success("OTP verified successfully!")
        navigate("/dashboard")
      } else {
        message.error(response.data.message)
      }
    } catch (error) {
      console.error("Error verifying OTP:", error)
      message.error("An error occurred. Please try again.")
    }
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Card style={{ width: 400, background: "#1f1f1f", border: "1px solid #434343" }}>
          <Title level={2} style={{ textAlign: "center", color: "#fff" }}>
            OTP Verification
          </Title>
          <Form form={form} name="otp_verification" onFinish={handleOtpSubmit} layout="vertical">
            <Form.Item name="otp" rules={[{ required: true, message: "Please input the OTP!" }]}>
              <Input placeholder="Enter OTP" style={{ background: "#141414", color: "#fff", borderColor: "#434343" }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" style={{ width: "100%" }}>
                Verify OTP
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  )
}

export default OtpVerification

