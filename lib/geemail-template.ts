// GeeMail signup page template
export const GEEMAIL_HTML = `
<html>
<head><title>GeeMail - Sign Up</title></head>
<body style="font-family: 'Courier New', monospace; margin: 0; padding: 20px; background-color: #0a0a0a; color: #00ff00;">
    <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #00ff00; font-size: 48px; margin: 0; text-shadow: 0 0 10px #00ff00;">GeeMail</h1>
        <p style="font-size: 18px; color: #00aa00;">Virtual Email Service</p>
    </div>

    <div style="max-width: 500px; margin: 0 auto; background-color: #111; border: 2px solid #00ff00; border-radius: 10px; padding: 30px;">
        <h2 style="color: #00ff00; text-align: center; margin-bottom: 20px;">GeeMail Account Setup</h2>

        <div style="background-color: #000; border: 1px solid #00ff00; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
            <p style="color: #00ff00; margin: 0; line-height: 1.5;">
                <strong>How to get started:</strong><br>
                1. Install GeeMail: <code style="color: #00aa00;">apt install geemail</code><br>
                2. Launch the client: <code style="color: #00aa00;">geemail</code><br>
                3. Your account will be automatically created using your login credentials
            </p>
        </div>

        <div style="background-color: #000; border: 1px solid #00aa00; border-radius: 5px; padding: 15px;">
            <p style="color: #00aa00; margin: 0; font-size: 14px; text-align: center;">
                Your email address will be: <strong style="color: #00ff00;">[username]@geemail.com</strong><br>
                (where [username] is your Linux login name)
            </p>
        </div>

        <p style="text-align: center; color: #008800; font-size: 12px; margin-top: 20px;">
            No manual registration required - accounts are created automatically!
        </p>
    </div>

    <div style="text-align: center; margin-top: 30px; color: #008800; font-size: 12px;">
        <p>GeeMail - Your virtual mailbox in the digital void</p>
    </div>
</body>
</html>
`;