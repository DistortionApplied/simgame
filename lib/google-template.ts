// Simple HTML Google homepage with basic styling
export const GOOGLE_HTML = `<html>
<head><title>Googoo</title></head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #fff; color: #202124;">
    <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4285f4; font-size: 86px; font-weight: normal; margin: 0;">Googo</h1>
    </div>
    <div style="text-align: center;">
        <form onsubmit="handleGoogoSearch(this.q.value, this.lucky && this.lucky.value); return false;" style="display: inline-block;">
            <input type="text" name="q" placeholder="Search Googo or type a URL" style="width: 100%; max-width: 584px; height: 44px; padding: 0 16px; border: 1px solid #dadce0; border-radius: 24px; font-size: 16px; outline: none; margin-bottom: 24px;">
            <div style="margin-bottom: 24px;">
                <button type="submit" style="background-color: #f8f9fa; border: 1px solid #f8f9fa; border-radius: 4px; color: #3c4043; padding: 12px 24px; font-size: 14px; cursor: pointer; margin: 0 6px;">Googo Search</button>
                <button type="submit" name="lucky" value="1" style="background-color: #f8f9fa; border: 1px solid #f8f9fa; border-radius: 4px; color: #3c4043; padding: 12px 24px; font-size: 14px; cursor: pointer; margin: 0 6px;">I'm Feeling Lucky</button>
            </div>
        </form>
        <p style="font-size: 13px; color: #70757a; margin: 20px 0;">
            Googo offered in: <a href="#" style="color: #1a0dab; text-decoration: none; margin: 0 5px;">Français</a> <a href="#" style="color: #1a0dab; text-decoration: none; margin: 0 5px;">Español</a> <a href="#" style="color: #1a0dab; text-decoration: none; margin: 0 5px;">Deutsch</a> <a href="#" style="color: #1a0dab; text-decoration: none; margin: 0 5px;">日本語</a> <a href="#" style="color: #1a0dab; text-decoration: none; margin: 0 5px;">中文</a>
        </p>
        <div style="background-color: #f2f2f2; border-top: 1px solid #e4e4e4; padding: 15px 30px; font-size: 14px; color: #70757a; margin-top: 20px;">
            <div style="max-width: 1000px; margin: 0 auto;">
                <span>
                    <a href="#" style="color: #70757a; text-decoration: none; margin: 0 10px;">About</a>
                    <a href="#" style="color: #70757a; text-decoration: none; margin: 0 10px;">Advertising</a>
                    <a href="#" style="color: #70757a; text-decoration: none; margin: 0 10px;">Business</a>
                    <a href="#" style="color: #70757a; text-decoration: none; margin: 0 10px;">How Search works</a>
                </span>
                <span style="float: right;">
                    <a href="#" style="color: #70757a; text-decoration: none; margin: 0 10px;">Privacy</a>
                    <a href="#" style="color: #70757a; text-decoration: none; margin: 0 10px;">Terms</a>
                    <a href="#" style="color: #70757a; text-decoration: none; margin: 0 10px;">Settings</a>
                </span>
            </div>
        </div>
    </div>
</body>
</html>`;