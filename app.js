// ==========================================
// EVENT MANAGEMENT SYSTEM - APPLICATION LOGIC
// ==========================================

// === GLOBAL STATE ===
const S = {
    // Current session
    session: null,

    // Data arrays
    users: [],
    vendors: [],
    products: [],
    cart: [],
    orders: [],
    requests: [],
    guests: [],
    memberships: [],

    // Counters
    nextUserId: 1,
    nextVendorId: 1,
    nextProductId: 1,
    nextOrderId: 1,
    nextRequestId: 1,
    nextMembershipNum: 1,

    // Temp state
    currentVendorView: null,
    currentOrderForUpdate: null,
    returnPageAfterUpdate: 'pg-vendor-product-status'
};

// === INITIALIZATION ===
function init() {
    loadData();
    setupDefaultData();
    initTheme(); // Initialize theme
    go('pg-index');
}

// === THEME MANAGEMENT ===
function initTheme() {
    const savedTheme = localStorage.getItem('ems_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').textContent = '☀️';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    // Update Icon
    document.getElementById('theme-toggle').textContent = isDark ? '☀️' : '🌙';

    // Save Preference
    localStorage.setItem('ems_theme', isDark ? 'dark' : 'light');
}

// === DATA PERSISTENCE ===
function saveData() {
    try {
        localStorage.setItem('ems_state', JSON.stringify(S));
    } catch (e) {
        console.error('Failed to save data:', e);
    }
}

function loadData() {
    try {
        const saved = localStorage.getItem('ems_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge saved state
            Object.assign(S, parsed);
        }
    } catch (e) {
        console.error('Failed to load data:', e);
    }
}

function setupDefaultData() {
    // Default admin
    if (!S.users.find(function (u) { return u.email === 'admin'; })) {
        // Admin is stored as a "user" with special flag
    }

    // Default test user
    if (S.users.length === 0) {
        S.users.push({
            id: S.nextUserId++,
            name: 'Test User',
            email: 'user@test.com',
            password: 'user123'
        });
    }

    // Default test vendor
    if (S.vendors.length === 0) {
        S.vendors.push({
            id: S.nextVendorId++,
            name: 'Riya Florist',
            email: 'riya@test.com',
            password: 'vendor123',
            category: 'Florist'
        });
    }

    saveData();
}

// === PAGE NAVIGATION ===
function go(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(function (p) {
        p.classList.remove('active');
    });

    // Show target page
    const target = document.getElementById(pageId);
    if (target) {
        target.classList.add('active');

        // Refresh page content
        refreshPage(pageId);
    }
}

function refreshPage(pageId) {
    switch (pageId) {
        case 'pg-vendor-home':
            if (S.session) {
                document.getElementById('v-welcome-name').textContent = 'Welcome   ' + S.session.name;
            }
            break;
        case 'pg-vendor-add-item':
            if (S.session) {
                document.getElementById('v-add-name').textContent = 'Welcome \'' + S.session.name + '\'';
            }
            renderVendorProductsTable();
            break;
        case 'pg-vendor-items':
            renderVendorItemsGrid();
            break;
        case 'pg-vendor-transactions':
            renderVendorTransactions();
            break;
        case 'pg-vendor-request-items':
            renderVendorRequests();
            break;
        case 'pg-vendor-product-status':
            renderVendorProductStatus();
            break;
        case 'pg-user-portal':
            if (S.session) {
                document.getElementById('user-welcome-text').textContent = 'WELCOME ' + S.session.name.toUpperCase();
            }
            renderVendors('All');
            updateCartBadge();
            break;
        case 'pg-vendors-list':
            filterAndShowVendors('All');
            break;
        case 'pg-cart':
            renderCart();
            break;
        case 'pg-checkout':
            renderCheckout();
            break;
        case 'pg-request-item':
            populateVendorDropdown();
            renderMyRequests();
            break;
        case 'pg-order-status':
            renderUserOrderStatus();
            break;
        case 'pg-guest-list':
            renderGuestList();
            break;
        case 'pg-admin-users':
            renderAdminUsers();
            break;
        case 'pg-admin-vendors':
            renderAdminVendors();
            break;
        case 'pg-admin-orders':
            renderAdminOrders();
            break;
        case 'pg-admin-requests':
            renderAdminRequests();
            break;
        case 'pg-admin-products':
            renderAdminProducts();
            break;
        case 'pg-admin-membership':
            renderMemberships();
            break;
    }
}

// === AUTHENTICATION ===
function adminLogin() {
    const id = document.getElementById('adm-id').value.trim();
    const pw = document.getElementById('adm-pw').value;

    clearAlert('adm-err');

    // Validation
    if (!id || !pw) {
        showAlert('adm-err', 'Please enter both User ID and Password', 'error');
        return;
    }

    if (id === 'admin' && pw === 'admin123') {
        S.session = {
            role: 'admin',
            name: 'Admin',
            email: 'admin'
        };
        saveData();
        go('pg-admin-home');
    } else {
        showAlert('adm-err', 'Invalid credentials', 'error');
    }
}

function vendorLogin() {
    const email = document.getElementById('vl-id').value.trim();
    const pw = document.getElementById('vl-pw').value;

    clearAlert('vl-err');

    if (!email || !pw) {
        showAlert('vl-err', 'Please enter both email and password', 'error');
        return;
    }

    const vendor = S.vendors.find(function (v) {
        return v.email === email && v.password === pw;
    });

    if (vendor) {
        S.session = {
            role: 'vendor',
            id: vendor.id,
            name: vendor.name,
            email: vendor.email,
            category: vendor.category
        };
        saveData();
        go('pg-vendor-home');
    } else {
        showAlert('vl-err', 'Invalid credentials', 'error');
    }
}

function userLogin() {
    const email = document.getElementById('ul-id').value.trim();
    const pw = document.getElementById('ul-pw').value;

    clearAlert('ul-err');

    if (!email || !pw) {
        showAlert('ul-err', 'Please enter both email and password', 'error');
        return;
    }

    const user = S.users.find(function (u) {
        return u.email === email && u.password === pw;
    });

    if (user) {
        S.session = {
            role: 'user',
            id: user.id,
            name: user.name,
            email: user.email
        };
        saveData();
        go('pg-user-portal');
    } else {
        showAlert('ul-err', 'Invalid credentials', 'error');
    }
}

function userSignup() {
    const name = document.getElementById('us-name').value.trim();
    const email = document.getElementById('us-email').value.trim();
    const pw = document.getElementById('us-pw').value;

    clearAlert('us-msg');

    // Validation
    if (!name || !email || !pw) {
        showAlert('us-msg', 'All fields are required', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showAlert('us-msg', 'Please enter a valid email address', 'error');
        return;
    }

    if (S.users.find(function (u) { return u.email === email; })) {
        showAlert('us-msg', 'Email already registered', 'error');
        return;
    }

    S.users.push({
        id: S.nextUserId++,
        name: name,
        email: email,
        password: pw
    });

    saveData();
    showAlert('us-msg', 'Account created successfully! Redirecting to login...', 'success');

    setTimeout(function () {
        document.getElementById('us-name').value = '';
        document.getElementById('us-email').value = '';
        document.getElementById('us-pw').value = '';
        go('pg-user-login');
    }, 1500);
}

function vendorSignup() {
    const name = document.getElementById('vs-name').value.trim();
    const email = document.getElementById('vs-email').value.trim();
    const pw = document.getElementById('vs-pw').value;
    const cat = document.getElementById('vs-cat').value;

    clearAlert('vs-msg');

    if (!name || !email || !pw || !cat) {
        showAlert('vs-msg', 'All fields are required', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showAlert('vs-msg', 'Please enter a valid email address', 'error');
        return;
    }

    if (S.vendors.find(function (v) { return v.email === email; })) {
        showAlert('vs-msg', 'Email already registered', 'error');
        return;
    }

    S.vendors.push({
        id: S.nextVendorId++,
        name: name,
        email: email,
        password: pw,
        category: cat
    });

    saveData();
    showAlert('vs-msg', 'Vendor account created! Redirecting to login...', 'success');

    setTimeout(function () {
        document.getElementById('vs-name').value = '';
        document.getElementById('vs-email').value = '';
        document.getElementById('vs-pw').value = '';
        document.getElementById('vs-cat').selectedIndex = 0;
        go('pg-vendor-login');
    }, 1500);
}

function logout() {
    S.session = null;
    S.cart = [];
    S.currentVendorView = null;
    saveData();
    go('pg-index');
}

// === VENDOR PRODUCT MANAGEMENT ===
function addProduct() {
    if (!S.session || S.session.role !== 'vendor') return;

    const name = document.getElementById('np-name').value.trim();
    const price = parseFloat(document.getElementById('np-price').value);
    const img = document.getElementById('np-img').value.trim();

    clearAlert('add-item-msg');

    if (!name || !price || price <= 0) {
        showAlert('add-item-msg', 'Please enter product name and valid price', 'error');
        return;
    }

    S.products.push({
        id: S.nextProductId++,
        vendorId: S.session.id,
        vendorName: S.session.name,
        name: name,
        price: price,
        image: img || 'https://via.placeholder.com/150?text=' + encodeURIComponent(name)
    });

    saveData();
    showAlert('add-item-msg', 'Product added successfully!', 'success');

    document.getElementById('np-name').value = '';
    document.getElementById('np-price').value = '';
    document.getElementById('np-img').value = '';

    renderVendorProductsTable();
}

function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;

    S.products = S.products.filter(function (p) { return p.id !== id; });
    saveData();
    renderVendorProductsTable();
    renderVendorItemsGrid();
}

function renderVendorProductsTable() {
    if (!S.session || S.session.role !== 'vendor') return;

    const tbody = document.getElementById('vendor-products-tbody');
    const myProducts = S.products.filter(function (p) {
        return p.vendorId === S.session.id;
    });

    if (myProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty">No products yet.</td></tr>';
        return;
    }

    tbody.innerHTML = myProducts.map(function (p) {
        return '<tr>' +
            '<td><img src="' + p.image + '" alt="' + p.name + '"></td>' +
            '<td>' + p.name + '</td>' +
            '<td>₹' + p.price + '</td>' +
            '<td><button class="btn btn-danger btn-sm" onclick="deleteProduct(' + p.id + ')">Delete</button></td>' +
            '</tr>';
    }).join('');
}

function renderVendorItemsGrid() {
    if (!S.session || S.session.role !== 'vendor') return;

    const grid = document.getElementById('vendor-items-grid');
    const myProducts = S.products.filter(function (p) {
        return p.vendorId === S.session.id;
    });

    if (myProducts.length === 0) {
        grid.innerHTML = '<p class="empty">No products yet.</p>';
        return;
    }

    grid.innerHTML = myProducts.map(function (p) {
        return '<div class="vendor-card">' +
            '<img src="' + p.image + '" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom:10px;">' +
            '<h4>' + p.name + '</h4>' +
            '<p>Price: ₹' + p.price + '</p>' +
            '</div>';
    }).join('');
}

function renderVendorTransactions() {
    if (!S.session || S.session.role !== 'vendor') return;

    const tbody = document.getElementById('vendor-trans-tbody');
    const myOrders = S.orders.filter(function (o) {
        return o.items.some(function (item) {
            return item.vendorId === S.session.id;
        });
    });

    if (myOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No transactions yet.</td></tr>';
        return;
    }

    tbody.innerHTML = myOrders.map(function (o) {
        const myItems = o.items.filter(function (item) {
            return item.vendorId === S.session.id;
        });
        const myTotal = myItems.reduce(function (sum, item) {
            return sum + (item.price * item.qty);
        }, 0);

        return '<tr>' +
            '<td>#' + o.id + '</td>' +
            '<td>' + o.customerName + '</td>' +
            '<td>' + myItems.map(function (i) { return i.name + ' (x' + i.qty + ')'; }).join(', ') + '</td>' +
            '<td>₹' + myTotal + '</td>' +
            '<td>' + o.payment + '</td>' +
            '<td>' + o.date + '</td>' +
            '</tr>';
    }).join('');
}

function renderVendorRequests() {
    if (!S.session || S.session.role !== 'vendor') return;

    const tbody = document.getElementById('vendor-req-tbody');
    const myRequests = S.requests.filter(function (r) {
        return r.vendorId === S.session.id;
    });

    if (myRequests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">No requests.</td></tr>';
        return;
    }

    tbody.innerHTML = myRequests.map(function (r) {
        return '<tr>' +
            '<td>' + r.userName + '</td>' +
            '<td>' + r.itemName + '</td>' +
            '<td>' + r.qty + '</td>' +
            '<td>' + r.status + '</td>' +
            '<td>' +
            (r.status === 'Pending' ?
                '<button class="btn btn-blue btn-sm" onclick="approveRequest(' + r.id + ')">Approve</button> ' +
                '<button class="btn btn-danger btn-sm" onclick="rejectRequest(' + r.id + ')">Reject</button>' :
                '-') +
            '</td>' +
            '</tr>';
    }).join('');
}

function approveRequest(id) {
    const req = S.requests.find(function (r) { return r.id === id; });
    if (req) {
        req.status = 'Approved';
        saveData();
        renderVendorRequests();
    }
}

function rejectRequest(id) {
    const req = S.requests.find(function (r) { return r.id === id; });
    if (req) {
        req.status = 'Rejected';
        saveData();
        renderVendorRequests();
    }
}

function renderVendorProductStatus() {
    if (!S.session || S.session.role !== 'vendor') return;

    const tbody = document.getElementById('vps-tbody');
    const myOrders = S.orders.filter(function (o) {
        return o.items.some(function (item) {
            return item.vendorId === S.session.id;
        });
    });

    if (myOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No orders yet.</td></tr>';
        return;
    }

    tbody.innerHTML = myOrders.map(function (o) {
        return '<tr>' +
            '<td>' + o.customerName + '</td>' +
            '<td>' + o.customerEmail + '</td>' +
            '<td>' + o.address + ', ' + o.city + '</td>' +
            '<td>' + o.status + '</td>' +
            '<td><button class="btn btn-blue btn-sm" onclick="openUpdateStatus(' + o.id + ')">Update</button></td>' +
            '<td><button class="btn btn-danger btn-sm" onclick="deleteOrder(' + o.id + ')">Delete</button></td>' +
            '</tr>';
    }).join('');
}

function openUpdateStatus(orderId) {
    S.currentOrderForUpdate = orderId;
    S.returnPageAfterUpdate = 'pg-vendor-product-status';
    go('pg-update-status');
}

function goBackFromUpdate() {
    go(S.returnPageAfterUpdate);
}

function saveStatus() {
    const selected = document.querySelector('input[name="upd-status"]:checked');
    if (!selected) {
        alert('Please select a status');
        return;
    }

    const order = S.orders.find(function (o) {
        return o.id === S.currentOrderForUpdate;
    });

    if (order) {
        order.status = selected.value;
        saveData();
        alert('Status updated successfully!');
        go(S.returnPageAfterUpdate);
    }
}

function deleteOrder(id) {
    if (!confirm('Delete this order?')) return;
    S.orders = S.orders.filter(function (o) { return o.id !== id; });
    saveData();
    renderVendorProductStatus();
}

// === USER - VENDOR BROWSING ===
function renderVendors(category) {
    const container = document.getElementById('vendor-list');
    const list = category === 'All' ? S.vendors : S.vendors.filter(function (v) {
        return v.category === category;
    });

    if (list.length === 0) {
        container.innerHTML = '<p class="empty">No vendors found.</p>';
        return;
    }

    container.innerHTML = list.map(function (v) {
        return '<div class="vendor-card">' +
            '<h4>' + v.name + '</h4>' +
            '<p>' + v.category + '</p>' +
            '<button class="btn btn-white btn-sm" onclick="openVendorProducts(' + v.id + ')">Shop Items</button>' +
            '</div>';
    }).join('');
}

function openVendorProducts(vendorId) {
    S.currentVendorView = vendorId;
    const vendor = S.vendors.find(function (v) { return v.id === vendorId; });

    if (!vendor) return;

    document.getElementById('products-vendor-name').textContent = vendor.name;
    document.getElementById('products-vendor-cat').textContent = vendor.category;

    const products = S.products.filter(function (p) {
        return p.vendorId === vendorId;
    });

    const container = document.getElementById('product-cards');

    if (products.length === 0) {
        container.innerHTML = '<p class="empty">No products available.</p>';
    } else {
        container.innerHTML = products.map(function (p) {
            return '<div class="vendor-card">' +
                '<img src="' + p.image + '" style="width:100%; height:150px; object-fit:cover; border-radius:8px; margin-bottom:10px;">' +
                '<h4>' + p.name + '</h4>' +
                '<p>₹' + p.price + '</p>' +
                '<button class="btn btn-blue btn-sm" onclick="addToCart(' + p.id + ')">Add to Cart</button>' +
                '</div>';
        }).join('');
    }

    go('pg-products');
}

// === CART ===
function addToCart(productId) {
    const product = S.products.find(function (p) { return p.id === productId; });
    if (!product) return;

    const existing = S.cart.find(function (c) { return c.productId === productId; });

    if (existing) {
        existing.qty++;
    } else {
        S.cart.push({
            productId: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            vendorId: product.vendorId,
            vendorName: product.vendorName,
            qty: 1
        });
    }

    saveData();
    updateCartBadge();
    alert('Added to cart!');
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        const count = S.cart.reduce(function (sum, c) { return sum + c.qty; }, 0);
        badge.textContent = count;
    }
}

function renderCart() {
    const emptyDiv = document.getElementById('cart-empty');
    const tableWrap = document.getElementById('cart-table-wrap');
    const tbody = document.getElementById('cart-tbody');
    const totalLabel = document.getElementById('cart-total-label');

    if (S.cart.length === 0) {
        emptyDiv.style.display = 'block';
        tableWrap.style.display = 'none';
        totalLabel.textContent = 'Grand Total     ₹0/-';
        return;
    }

    emptyDiv.style.display = 'none';
    tableWrap.style.display = 'block';

    let grandTotal = 0;

    tbody.innerHTML = S.cart.map(function (c) {
        const total = c.price * c.qty;
        grandTotal += total;

        return '<tr>' +
            '<td><img src="' + c.image + '" alt="' + c.name + '"></td>' +
            '<td>' + c.name + '</td>' +
            '<td>₹' + c.price + '</td>' +
            '<td>' +
            '<button class="btn btn-sm" onclick="decreaseQty(' + c.productId + ')">-</button> ' +
            c.qty + ' ' +
            '<button class="btn btn-sm" onclick="increaseQty(' + c.productId + ')">+</button>' +
            '</td>' +
            '<td>₹' + total + '</td>' +
            '<td><button class="btn btn-danger btn-sm" onclick="removeFromCart(' + c.productId + ')">Remove</button></td>' +
            '</tr>';
    }).join('');

    totalLabel.textContent = 'Grand Total     ₹' + grandTotal + '/-';
}

function increaseQty(productId) {
    const item = S.cart.find(function (c) { return c.productId === productId; });
    if (item) {
        item.qty++;
        saveData();
        renderCart();
        updateCartBadge();
    }
}

function decreaseQty(productId) {
    const item = S.cart.find(function (c) { return c.productId === productId; });
    if (item && item.qty > 1) {
        item.qty--;
        saveData();
        renderCart();
        updateCartBadge();
    }
}

function removeFromCart(productId) {
    S.cart = S.cart.filter(function (c) { return c.productId !== productId; });
    saveData();
    renderCart();
    updateCartBadge();
}

function clearCart() {
    if (!confirm('Clear all items from cart?')) return;
    S.cart = [];
    saveData();
    renderCart();
    updateCartBadge();
}

// === CHECKOUT ===
function renderCheckout() {
    const total = S.cart.reduce(function (sum, c) {
        return sum + (c.price * c.qty);
    }, 0);

    const itemCount = S.cart.reduce(function (sum, c) {
        return sum + c.qty;
    }, 0);

    document.getElementById('checkout-total-header').textContent =
        'Items: ' + itemCount + '    Grand Total     ₹' + total + '/-';
}

function placeOrder() {
    if (S.cart.length === 0) {
        alert('Cart is empty');
        return;
    }

    const name = document.getElementById('co-name').value.trim();
    const num = document.getElementById('co-num').value.trim();
    const email = document.getElementById('co-email').value.trim();
    const pay = document.getElementById('co-pay').value;
    const addr = document.getElementById('co-addr').value.trim();
    const state = document.getElementById('co-state').value.trim();
    const city = document.getElementById('co-city').value.trim();
    const pin = document.getElementById('co-pin').value.trim();

    clearAlert('co-msg');

    if (!name || !num || !email || !pay || !addr || !state || !city || !pin) {
        showAlert('co-msg', 'All fields are required', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showAlert('co-msg', 'Please enter a valid email', 'error');
        return;
    }

    const total = S.cart.reduce(function (sum, c) {
        return sum + (c.price * c.qty);
    }, 0);

    const order = {
        id: S.nextOrderId++,
        userId: S.session ? S.session.id : null,
        customerName: name,
        customerEmail: email,
        customerPhone: num,
        address: addr,
        city: city,
        state: state,
        pin: pin,
        payment: pay,
        items: S.cart.map(function (c) {
            return {
                productId: c.productId,
                vendorId: c.vendorId,
                vendorName: c.vendorName,
                name: c.name,
                price: c.price,
                qty: c.qty
            };
        }),
        total: total,
        status: 'Pending',
        date: new Date().toLocaleDateString()
    };

    S.orders.push(order);

    // Clear cart
    S.cart = [];

    saveData();
    updateCartBadge();

    // Show success page
    const detail = document.getElementById('success-detail');
    detail.innerHTML =
        '<strong>Order ID:</strong> #' + order.id + '<br>' +
        '<strong>Name:</strong> ' + name + '<br>' +
        '<strong>Email:</strong> ' + email + '<br>' +
        '<strong>Phone:</strong> ' + num + '<br>' +
        '<strong>Address:</strong> ' + addr + ', ' + city + ', ' + state + ' - ' + pin + '<br>' +
        '<strong>Payment:</strong> ' + pay + '<br>' +
        '<strong>Total Amount:</strong> ₹' + total + '/-';

    // Clear form
    document.getElementById('co-name').value = '';
    document.getElementById('co-num').value = '';
    document.getElementById('co-email').value = '';
    document.getElementById('co-pay').selectedIndex = 0;
    document.getElementById('co-addr').value = '';
    document.getElementById('co-state').value = '';
    document.getElementById('co-city').value = '';
    document.getElementById('co-pin').value = '';

    go('pg-success');
}

function continueShopping() {
    go('pg-user-portal');
}

// === USER REQUESTS ===
function populateVendorDropdown() {
    const select = document.getElementById('ri-vendor');
    select.innerHTML = '<option value="">Select Vendor</option>' +
        S.vendors.map(function (v) {
            return '<option value="' + v.id + '">' + v.name + ' (' + v.category + ')</option>';
        }).join('');
}

function submitRequest() {
    if (!S.session || S.session.role !== 'user') return;

    const vendorId = parseInt(document.getElementById('ri-vendor').value);
    const itemName = document.getElementById('ri-item').value.trim();
    const qty = parseInt(document.getElementById('ri-qty').value);

    clearAlert('ri-msg');

    if (!vendorId || !itemName || !qty || qty <= 0) {
        showAlert('ri-msg', 'Please fill all fields correctly', 'error');
        return;
    }

    const vendor = S.vendors.find(function (v) { return v.id === vendorId; });
    if (!vendor) return;

    S.requests.push({
        id: S.nextRequestId++,
        userId: S.session.id,
        userName: S.session.name,
        vendorId: vendorId,
        vendorName: vendor.name,
        itemName: itemName,
        qty: qty,
        status: 'Pending'
    });

    saveData();
    showAlert('ri-msg', 'Request submitted successfully!', 'success');

    document.getElementById('ri-vendor').selectedIndex = 0;
    document.getElementById('ri-item').value = '';
    document.getElementById('ri-qty').value = '';

    renderMyRequests();
}

function renderMyRequests() {
    if (!S.session || S.session.role !== 'user') return;

    const tbody = document.getElementById('my-req-tbody');
    const myReqs = S.requests.filter(function (r) {
        return r.userId === S.session.id;
    });

    if (myReqs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty">No requests yet.</td></tr>';
        return;
    }

    tbody.innerHTML = myReqs.map(function (r) {
        return '<tr>' +
            '<td>' + r.vendorName + '</td>' +
            '<td>' + r.itemName + '</td>' +
            '<td>' + r.qty + '</td>' +
            '<td>' + r.status + '</td>' +
            '</tr>';
    }).join('');
}

function renderUserOrderStatus() {
    if (!S.session || S.session.role !== 'user') return;

    const tbody = document.getElementById('order-status-tbody');
    const myOrders = S.orders.filter(function (o) {
        return o.userId === S.session.id;
    });

    if (myOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty">No orders yet.</td></tr>';
        return;
    }

    tbody.innerHTML = myOrders.map(function (o) {
        return '<tr>' +
            '<td>' + o.customerName + '</td>' +
            '<td>' + o.customerEmail + '</td>' +
            '<td>' + o.address + ', ' + o.city + '</td>' +
            '<td>' + o.status + '</td>' +
            '</tr>';
    }).join('');
}

// === GUEST LIST ===
function addGuest() {
    if (!S.session || S.session.role !== 'user') return;

    const name = document.getElementById('g-name').value.trim();
    const phone = document.getElementById('g-phone').value.trim();
    const email = document.getElementById('g-email').value.trim();

    if (!name || !phone || !email) {
        alert('All fields are required');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Please enter a valid email');
        return;
    }

    S.guests.push({
        userId: S.session.id,
        name: name,
        phone: phone,
        email: email
    });

    saveData();

    document.getElementById('g-name').value = '';
    document.getElementById('g-phone').value = '';
    document.getElementById('g-email').value = '';

    renderGuestList();
}

function renderGuestList() {
    if (!S.session || S.session.role !== 'user') return;

    const tbody = document.getElementById('guest-tbody');
    const myGuests = S.guests.filter(function (g) {
        return g.userId === S.session.id;
    });

    if (myGuests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">No guests added yet.</td></tr>';
        return;
    }

    tbody.innerHTML = myGuests.map(function (g, idx) {
        return '<tr>' +
            '<td>' + (idx + 1) + '</td>' +
            '<td>' + g.name + '</td>' +
            '<td>' + g.phone + '</td>' +
            '<td>' + g.email + '</td>' +
            '<td><button class="btn btn-danger btn-sm" onclick="removeGuest(' + idx + ')">Remove</button></td>' +
            '</tr>';
    }).join('');
}

function removeGuest(idx) {
    if (!S.session || S.session.role !== 'user') return;

    const myGuests = S.guests.filter(function (g) {
        return g.userId === S.session.id;
    });

    if (idx >= 0 && idx < myGuests.length) {
        const guestToRemove = myGuests[idx];
        const globalIdx = S.guests.indexOf(guestToRemove);
        if (globalIdx > -1) {
            S.guests.splice(globalIdx, 1);
            saveData();
            renderGuestList();
        }
    }
}

// === ADMIN - USER MANAGEMENT ===
function renderAdminUsers() {
    const tbody = document.getElementById('admin-users-tbody');

    if (S.users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty">No users yet.</td></tr>';
        return;
    }

    tbody.innerHTML = S.users.map(function (u) {
        return '<tr>' +
            '<td>' + u.name + '</td>' +
            '<td>' + u.email + '</td>' +
            '<td><button class="btn btn-blue btn-sm" onclick="showUserForm(\'edit\', ' + u.id + ')">Update</button></td>' +
            '<td><button class="btn btn-danger btn-sm" onclick="deleteUser(' + u.id + ')">Delete</button></td>' +
            '</tr>';
    }).join('');
}

function showUserForm(mode, userId) {
    const form = document.getElementById('user-form');
    const title = document.getElementById('uf-title');

    form.style.display = 'block';

    if (mode === 'add') {
        title.textContent = 'Add User';
        document.getElementById('uf-id').value = '';
        document.getElementById('uf-name').value = '';
        document.getElementById('uf-email').value = '';
        document.getElementById('uf-pw').value = '';
    } else {
        const user = S.users.find(function (u) { return u.id === userId; });
        if (!user) return;

        title.textContent = 'Edit User';
        document.getElementById('uf-id').value = user.id;
        document.getElementById('uf-name').value = user.name;
        document.getElementById('uf-email').value = user.email;
        document.getElementById('uf-pw').value = user.password;
    }
}

function saveUser() {
    const id = document.getElementById('uf-id').value;
    const name = document.getElementById('uf-name').value.trim();
    const email = document.getElementById('uf-email').value.trim();
    const pw = document.getElementById('uf-pw').value;

    if (!name || !email || !pw) {
        alert('All fields are required');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Please enter a valid email');
        return;
    }

    if (id) {
        // Update
        const user = S.users.find(function (u) { return u.id == id; });
        if (user) {
            user.name = name;
            user.email = email;
            user.password = pw;
        }
    } else {
        // Add
        S.users.push({
            id: S.nextUserId++,
            name: name,
            email: email,
            password: pw
        });
    }

    saveData();
    document.getElementById('user-form').style.display = 'none';
    renderAdminUsers();
}

function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    S.users = S.users.filter(function (u) { return u.id !== id; });
    saveData();
    renderAdminUsers();
}

// === ADMIN - VENDOR MANAGEMENT ===
function renderAdminVendors() {
    const tbody = document.getElementById('admin-vendors-tbody');

    if (S.vendors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">No vendors yet.</td></tr>';
        return;
    }

    tbody.innerHTML = S.vendors.map(function (v) {
        return '<tr>' +
            '<td>' + v.name + '</td>' +
            '<td>' + v.email + '</td>' +
            '<td>' + v.category + '</td>' +
            '<td><button class="btn btn-blue btn-sm" onclick="showVendorForm(\'edit\', ' + v.id + ')">Update</button></td>' +
            '<td><button class="btn btn-danger btn-sm" onclick="deleteVendor(' + v.id + ')">Delete</button></td>' +
            '</tr>';
    }).join('');
}

function showVendorForm(mode, vendorId) {
    const form = document.getElementById('vendor-form');
    const title = document.getElementById('vf-title');

    form.style.display = 'block';

    if (mode === 'add') {
        title.textContent = 'Add Vendor';
        document.getElementById('vf-id').value = '';
        document.getElementById('vf-name').value = '';
        document.getElementById('vf-email').value = '';
        document.getElementById('vf-pw').value = '';
        document.getElementById('vf-cat').selectedIndex = 0;
    } else {
        const vendor = S.vendors.find(function (v) { return v.id === vendorId; });
        if (!vendor) return;

        title.textContent = 'Edit Vendor';
        document.getElementById('vf-id').value = vendor.id;
        document.getElementById('vf-name').value = vendor.name;
        document.getElementById('vf-email').value = vendor.email;
        document.getElementById('vf-pw').value = vendor.password;
        document.getElementById('vf-cat').value = vendor.category;
    }
}

function saveVendor() {
    const id = document.getElementById('vf-id').value;
    const name = document.getElementById('vf-name').value.trim();
    const email = document.getElementById('vf-email').value.trim();
    const pw = document.getElementById('vf-pw').value;
    const cat = document.getElementById('vf-cat').value;

    if (!name || !email || !pw || !cat) {
        alert('All fields are required');
        return;
    }

    if (!isValidEmail(email)) {
        alert('Please enter a valid email');
        return;
    }

    if (id) {
        // Update
        const vendor = S.vendors.find(function (v) { return v.id == id; });
        if (vendor) {
            vendor.name = name;
            vendor.email = email;
            vendor.password = pw;
            vendor.category = cat;
        }
    } else {
        // Add
        S.vendors.push({
            id: S.nextVendorId++,
            name: name,
            email: email,
            password: pw,
            category: cat
        });
    }

    saveData();
    document.getElementById('vendor-form').style.display = 'none';
    renderAdminVendors();
}

function deleteVendor(id) {
    if (!confirm('Delete this vendor?')) return;
    S.vendors = S.vendors.filter(function (v) { return v.id !== id; });
    saveData();
    renderAdminVendors();
}

// === ADMIN - ORDERS ===
function renderAdminOrders() {
    const tbody = document.getElementById('admin-orders-tbody');

    if (S.orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty">No orders yet.</td></tr>';
        return;
    }

    tbody.innerHTML = S.orders.map(function (o) {
        const itemSummary = o.items.map(function (i) {
            return i.name + ' (x' + i.qty + ')';
        }).join(', ');

        return '<tr>' +
            '<td>#' + o.id + '</td>' +
            '<td>' + o.customerName + '</td>' +
            '<td>' + itemSummary + '</td>' +
            '<td>₹' + o.total + '</td>' +
            '<td>' + o.payment + '</td>' +
            '<td>' + o.status + '</td>' +
            '<td>' + o.date + '</td>' +
            '<td><button class="btn btn-blue btn-sm" onclick="adminUpdateOrder(' + o.id + ')">Update</button></td>' +
            '</tr>';
    }).join('');
}

function adminUpdateOrder(orderId) {
    S.currentOrderForUpdate = orderId;
    S.returnPageAfterUpdate = 'pg-admin-orders';
    go('pg-update-status');
}

// === ADMIN - REQUESTS ===
function renderAdminRequests() {
    const tbody = document.getElementById('admin-req-tbody');

    if (S.requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty">No requests.</td></tr>';
        return;
    }

    tbody.innerHTML = S.requests.map(function (r) {
        return '<tr>' +
            '<td>' + r.userName + '</td>' +
            '<td>' + r.vendorName + '</td>' +
            '<td>' + r.itemName + '</td>' +
            '<td>' + r.qty + '</td>' +
            '<td>' + r.status + '</td>' +
            '<td>' +
            (r.status === 'Pending' ?
                '<button class="btn btn-blue btn-sm" onclick="adminApproveRequest(' + r.id + ')">Approve</button> ' +
                '<button class="btn btn-danger btn-sm" onclick="adminRejectRequest(' + r.id + ')">Reject</button>' :
                '-') +
            '</td>' +
            '</tr>';
    }).join('');
}

function adminApproveRequest(id) {
    const req = S.requests.find(function (r) { return r.id === id; });
    if (req) {
        req.status = 'Approved';
        saveData();
        renderAdminRequests();
    }
}

function adminRejectRequest(id) {
    const req = S.requests.find(function (r) { return r.id === id; });
    if (req) {
        req.status = 'Rejected';
        saveData();
        renderAdminRequests();
    }
}

// === ADMIN - PRODUCTS ===
function renderAdminProducts() {
    const tbody = document.getElementById('admin-products-tbody');

    if (S.products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">No products yet.</td></tr>';
        return;
    }

    tbody.innerHTML = S.products.map(function (p) {
        return '<tr>' +
            '<td><img src="' + p.image + '" alt="' + p.name + '"></td>' +
            '<td>' + p.name + '</td>' +
            '<td>₹' + p.price + '</td>' +
            '<td>' + p.vendorName + '</td>' +
            '<td><button class="btn btn-danger btn-sm" onclick="adminDeleteProduct(' + p.id + ')">Delete</button></td>' +
            '</tr>';
    }).join('');
}

function adminDeleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    S.products = S.products.filter(function (p) { return p.id !== id; });
    saveData();
    renderAdminProducts();
}

// === ADMIN - MEMBERSHIP ===
function addMembership() {
    const vendor = document.getElementById('mem-vendor').value.trim();
    const duration = document.querySelector('input[name="mem-dur"]:checked');

    clearAlert('add-mem-msg');

    if (!vendor) {
        showAlert('add-mem-msg', 'Vendor name is required', 'error');
        return;
    }

    if (!duration) {
        showAlert('add-mem-msg', 'Please select a duration', 'error');
        return;
    }

    S.memberships.push({
        number: S.nextMembershipNum++,
        vendorName: vendor,
        duration: duration.value,
        dateAdded: new Date().toLocaleDateString(),
        status: 'Active'
    });

    saveData();
    showAlert('add-mem-msg', 'Membership added successfully!', 'success');

    document.getElementById('mem-vendor').value = '';
    document.querySelector('input[name="mem-dur"][value="6 months"]').checked = true;

    renderMemberships();
}

function lookupMembership(num) {
    if (!num) {
        document.getElementById('mem-name-display').value = '';
        return;
    }

    const mem = S.memberships.find(function (m) {
        return m.number == num;
    });

    if (mem) {
        document.getElementById('mem-name-display').value = mem.vendorName;
    } else {
        document.getElementById('mem-name-display').value = '';
    }
}

function updateMembership() {
    const num = document.getElementById('mem-num').value;
    const action = document.querySelector('input[name="mem-ext"]:checked');

    clearAlert('upd-mem-msg');

    if (!num) {
        showAlert('upd-mem-msg', 'Membership Number is required', 'error');
        return;
    }

    if (!action) {
        showAlert('upd-mem-msg', 'Please select an action', 'error');
        return;
    }

    const mem = S.memberships.find(function (m) {
        return m.number == num;
    });

    if (!mem) {
        showAlert('upd-mem-msg', 'Membership not found', 'error');
        return;
    }

    if (action.value === 'cancel') {
        mem.status = 'Cancelled';
    } else {
        mem.duration = action.value;
        mem.dateAdded = new Date().toLocaleDateString();
        mem.status = 'Active';
    }

    saveData();
    showAlert('upd-mem-msg', 'Membership updated successfully!', 'success');

    document.getElementById('mem-num').value = '';
    document.getElementById('mem-name-display').value = '';
    document.querySelector('input[name="mem-ext"][value="6 months"]').checked = true;

    renderMemberships();
}

function renderMemberships() {
    const tbody = document.getElementById('mem-tbody');

    if (S.memberships.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty">No memberships yet.</td></tr>';
        return;
    }

    tbody.innerHTML = S.memberships.map(function (m) {
        return '<tr>' +
            '<td>#' + m.number + '</td>' +
            '<td>' + m.vendorName + '</td>' +
            '<td>' + m.duration + '</td>' +
            '<td>' + m.dateAdded + '</td>' +
            '<td>' + m.status + '</td>' +
            '</tr>';
    }).join('');
}

// === UTILITIES ===
function showAlert(id, message, type) {
    const el = document.getElementById(id);
    if (!el) return;

    el.className = 'alert alert-' + type + ' show';
    el.textContent = message;
}

function clearAlert(id) {
    const el = document.getElementById(id);
    if (!el) return;

    el.className = 'alert';
    el.textContent = '';
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// === INITIALIZE ON LOAD ===
window.addEventListener('DOMContentLoaded', init);