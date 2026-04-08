// Amazon-style homepage template for Spamazon
export const SPAMAZON_HTML = `<html>
<head><title>Spamazon</title></head>
<body style="margin: 0; font-family: Arial, sans-serif; background-color: #EAEDED;">
    <!-- Header -->
    <div style="background-color: #232F3E; padding: 10px 20px; color: white;">
        <div style="display: flex; align-items: center; max-width: 1200px; margin: 0 auto;">
            <!-- Logo -->
            <div style="font-size: 24px; font-weight: bold; color: #FF9900; margin-right: 20px;">Spamazon</div>
            <!-- Search Bar -->
            <div style="flex: 1; max-width: 600px;">
                <input type="text" placeholder="Search Spamazon" style="width: 100%; padding: 8px; border: none; border-radius: 4px 0 0 4px; height: 38px;">
                <button style="background-color: #FF9900; border: none; padding: 8px 12px; border-radius: 0 4px 4px 0; height: 38px; cursor: pointer;">Search</button>
            </div>
            <!-- Account -->
            <div style="margin-left: 20px;">
                <a href="#" style="color: white; text-decoration: none;">Hello, Sign in Account & Lists</a>
            </div>
            <!-- Cart -->
            <div style="margin-left: 20px;">
                <a href="#" style="color: white; text-decoration: none;">🛒 Cart (0)</a>
            </div>
        </div>
    </div>

    <!-- Navigation -->
    <div style="background-color: #37475A; padding: 8px 20px;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex;">
            <a href="#" style="color: white; text-decoration: none; margin-right: 20px;">All</a>
            <a href="#" style="color: white; text-decoration: none; margin-right: 20px;">Today's Deals</a>
            <a href="#" style="color: white; text-decoration: none; margin-right: 20px;">Customer Service</a>
            <a href="#" style="color: white; text-decoration: none; margin-right: 20px;">Registry</a>
            <a href="#" style="color: white; text-decoration: none; margin-right: 20px;">Gift Cards</a>
            <a href="#" style="color: white; text-decoration: none; margin-right: 20px;">Sell</a>
        </div>
    </div>

    <!-- Hero Banner -->
    <div style="background-color: #F3F3F3; padding: 20px; text-align: center;">
        <h1 style="color: #232F3E; margin: 0;">Welcome to Spamazon</h1>
        <p>Your one-stop shop for virtual goods and simulated products!</p>
    </div>

    <!-- Product Grid -->
    <div style="max-width: 1200px; margin: 20px auto; padding: 0 20px;">
        <h2 style="color: #232F3E;">Featured Products</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px;">
            <!-- Product 1 -->
            <div style="background: white; border: 1px solid #DDD; border-radius: 4px; padding: 10px; text-align: center;">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGM0YzIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qcm9kdWN0PC90ZXh0Pgo8L3N2Zz4K" alt="Virtual Hacking Tool" style="width: 100px; height: 100px; margin-bottom: 10px;">
                <h3 style="margin: 10px 0; font-size: 16px;">Virtual Hacking Tool</h3>
                <p style="color: #B12704; font-weight: bold;">$50.00</p>
                <button style="background-color: #FF9900; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Add to Cart</button>
            </div>
            <!-- Product 2 -->
            <div style="background: white; border: 1px solid #DDD; border-radius: 4px; padding: 10px; text-align: center;">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGM0YzIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qcm9kdWN0PC90ZXh0Pgo8L3N2Zz4K" alt="Game Upgrade Pack" style="width: 100px; height: 100px; margin-bottom: 10px;">
                <h3 style="margin: 10px 0; font-size: 16px;">Game Upgrade Pack</h3>
                <p style="color: #B12704; font-weight: bold;">$25.00</p>
                <button style="background-color: #FF9900; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Add to Cart</button>
            </div>
            <!-- Product 3 -->
            <div style="background: white; border: 1px solid #DDD; border-radius: 4px; padding: 10px; text-align: center;">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGM0YzIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qcm9kdWN0PC90ZXh0Pgo8L3N2Zz4K" alt="Digital Art Collection" style="width: 100px; height: 100px; margin-bottom: 10px;">
                <h3 style="margin: 10px 0; font-size: 16px;">Digital Art Collection</h3>
                <p style="color: #B12704; font-weight: bold;">$15.00</p>
                <button style="background-color: #FF9900; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Add to Cart</button>
            </div>
            <!-- Product 4 -->
            <div style="background: white; border: 1px solid #DDD; border-radius: 4px; padding: 10px; text-align: center;">
                <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGM0YzIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Qcm9kdWN0PC90ZXh0Pgo8L3N2Zz4K" alt="Software Package" style="width: 100px; height: 100px; margin-bottom: 10px;">
                <h3 style="margin: 10px 0; font-size: 16px;">Software Package</h3>
                <p style="color: #B12704; font-weight: bold;">$30.00</p>
                <button style="background-color: #FF9900; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Add to Cart</button>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #232F3E; color: white; padding: 20px; text-align: center; margin-top: 40px;">
        <p>&copy; 2026 Spamazon. All rights reserved. | <a href="#" style="color: #FF9900; text-decoration: none;">Privacy Policy</a> | <a href="#" style="color: #FF9900; text-decoration: none;">Terms of Service</a></p>
    </div>
</body>
</html>`;