import nodemailer from "nodemailer";
import { logger } from "../logger";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendIngestionSuccessEmail = async (documentName: string, chunkCount: number, recipientEmail: string = "kanojiarahul2004@gmail.com") => {
  await transporter.sendMail({
  from: `"Clario Ingestion" <${process.env.SMTP_USER}>`,
  to: recipientEmail,
  subject: `Successful Upload: ${documentName}`,
  html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>Document Ingestion Complete</title>
</head>

<body style="margin:0;padding:40px 20px;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

<table width="100%" cellspacing="0" cellpadding="0">
<tr>
<td align="center">

<table width="600" cellspacing="0" cellpadding="0"
style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">

<tr>
<td style="padding:32px;border-bottom:1px solid #e5e7eb;">
<h1 style="margin:0;font-size:24px;font-weight:600;color:#111827;">
Document Ingestion Complete
</h1>

<p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#4b5563;">
Your document has been successfully processed and stored in the vector database.
</p>
</td>
</tr>

<tr>
<td style="padding:32px;">

<table width="100%" cellspacing="0" cellpadding="10"
style="border:1px solid #e5e7eb;border-radius:8px;">

<tr>
<td style="color:#6b7280;font-size:14px;width:40%;">
Document Name
</td>

<td style="color:#111827;font-size:14px;font-weight:600;">
${documentName}
</td>
</tr>

<tr>
<td style="color:#6b7280;font-size:14px;border-top:1px solid #e5e7eb;">
Chunks Generated
</td>

<td style="color:#111827;font-size:14px;font-weight:600;border-top:1px solid #e5e7eb;">
${chunkCount}
</td>
</tr>

</table>

<p style="margin:28px 0 0;font-size:15px;line-height:1.7;color:#374151;">
Your document is now ready to be queried by the AI.
</p>

</td>
</tr>

<tr>
<td style="padding:24px 32px;background:#fafafa;border-top:1px solid #e5e7eb;">

<p style="margin:0;font-size:13px;color:#6b7280;">
This email was sent automatically by Clario.
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
});
    logger.info({ documentName, recipientEmail }, "Ingestion success email sent.");
  } catch (error) {
    logger.error({ err: error, documentName }, "Failed to send ingestion success email.");
  }
};
