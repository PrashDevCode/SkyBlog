import nodemailer from "nodemailer";

// ✅ Brevo SMTP transporter
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) {
    console.error("❌ Brevo SMTP connection failed:", error.message);
  } else {
    console.log("✅ Brevo SMTP ready");
  }
});

// Base email template wrapper
function baseTemplate(content) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; color: #111;">
      <div style="background: #000; padding: 24px 32px;">
        <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 700;">
          Sky<span style="color: #9ca3af;">Blog</span>
        </h1>
      </div>
      <div style="padding: 32px;">
        ${content}
      </div>
      <div style="padding: 24px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #9ca3af;">
          © ${new Date().getFullYear()} SkyBlog. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

// ✅ Welcome email on signup
async function sendWelcomeEmail(user) {
  try {
    await transporter.sendMail({
      from: `"SkyBlog" <${process.env.BREVO_SENDER_EMAIL}>`,
      to: user.email,
      subject: "Welcome to SkyBlog! 🎉",
      html: baseTemplate(`
        <h2 style="font-size: 24px; font-weight: 700; margin: 0 0 8px;">Welcome, ${user.fullName}!</h2>
        <p style="color: #6b7280; margin: 0 0 24px; font-size: 15px;">
          Your account has been created. You're all set to start writing and reading on SkyBlog.
        </p>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
          <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600;">Here's what you can do:</p>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #6b7280; line-height: 2;">
            <li>✍️ Write and publish blog posts</li>
            <li>💬 Comment on articles</li>
            <li>👤 Customize your profile</li>
            <li>🔍 Discover articles by category</li>
          </ul>
        </div>
        <a href="${process.env.APP_URL || 'http://localhost:5000'}"
          style="display: inline-block; padding: 12px 28px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
          Get Started →
        </a>
      `),
    });
    console.log("✅ Welcome email sent to:", user.email);
  } catch (error) {
    console.error("❌ Welcome email failed:", error.message);
  }
}

// ✅ Comment notification to blog author
async function sendCommentNotification(author, blog, commenter) {
  try {
    await transporter.sendMail({
      from: `"SkyBlog" <${process.env.BREVO_SENDER_EMAIL}>`,
      to: author.email,
      subject: `💬 New comment on "${blog.title}"`,
      html: baseTemplate(`
        <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">New Comment on Your Post</h2>
        <p style="color: #6b7280; margin: 0 0 24px; font-size: 15px;">
          <strong style="color: #111;">${commenter.fullName}</strong> left a comment on your article.
        </p>
        <div style="border-left: 3px solid #000; padding-left: 16px; margin-bottom: 28px;">
          <p style="font-size: 15px; font-weight: 600; margin: 0 0 6px; color: #111;">${blog.title}</p>
          <p style="font-size: 14px; color: #6b7280; margin: 0; font-style: italic;">"${commenter.content}"</p>
        </div>
        <a href="${process.env.APP_URL || 'http://localhost:5000'}/blog/${blog._id}#comments"
          style="display: inline-block; padding: 12px 28px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
          View Comment →
        </a>
      `),
    });
    console.log("✅ Comment notification sent to:", author.email);
  } catch (error) {
    console.error("❌ Comment notification failed:", error.message);
  }
}

// ✅ New blog published notification
async function sendPublishedNotification(blog, authorName, subscribers) {
  try {
    const emailPromises = subscribers.map(subscriber =>
      transporter.sendMail({
        from: `"SkyBlog" <${process.env.BREVO_SENDER_EMAIL}>`,
        to: subscriber.email,
        subject: `📝 New article: "${blog.title}"`,
        html: baseTemplate(`
          <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">New Article Published</h2>
          <p style="color: #6b7280; margin: 0 0 24px; font-size: 15px;">
            <strong style="color: #111;">${authorName}</strong> just published a new article.
          </p>
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 28px;">
            <p style="font-size: 16px; font-weight: 600; margin: 0 0 8px; color: #111;">${blog.title}</p>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              ${blog.excerpt || "Read the full article on SkyBlog."}
            </p>
            ${blog.category ? `<span style="display:inline-block;margin-top:12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;">${blog.category}</span>` : ''}
          </div>
          <a href="${process.env.APP_URL || 'http://localhost:5000'}/blog/${blog._id}"
            style="display: inline-block; padding: 12px 28px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
            Read Article →
          </a>
        `),
      })
    );
    await Promise.allSettled(emailPromises);
    console.log(`✅ Published notification sent to ${subscribers.length} users`);
  } catch (error) {
    console.error("❌ Published notification failed:", error.message);
  }
}

export { sendWelcomeEmail, sendCommentNotification, sendPublishedNotification };