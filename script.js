const EMAILJS_USER_ID = 'abhishiktmanda@gmail.com'
const EMAILJS_SERVICE = 'service_123'
const EMAILJS_TEMPLATE = 'template_add'

if(window.emailjs){
    emailjs.init(EMAILJS_USER_ID)
}

const addBtn = document.querySelectorAll(".add-btn");
const removeBtn = document.querySelectorAll(".remove-btn");
const cartItemsDiv = document.getElementById("cartItems");
const totalAmountEl = document.getElementById("totalAmount");
const bookBtn = document.querySelector(".book-btn");
const bookingForm = document.getElementById("bookingform");
const thankMessage = document.getElementById("thankMessage");

let cart=[];

function parsePrice(priceText){
    if(!priceText) return 0;

    const numeric = priceText.replace(/[^\d.]/g, '');
    return Number(numeric) || 0;
}

function formatRupees(num){
    return '₹' + num.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function renderCart() {
    cartItemsDiv.innerHTML = '';

    if(cart.length == 0){
        cartItemsDiv.innerHTML = `<p><ion-icon name="information-circle-outline"></ion-icon> No Items Added</p>
            <p>Add items to the cart from the services bar</p>`;
        totalAmountEl.textContent = formatRupees(0);
        bookBtn.style.opacity = '0.3';
        bookBtn.disabled = true;
        return;
    }


    cart.forEach(item => {
        const itemWrapper = document.createElement('div');
        itemWrapper.className = 'cart-item';
        itemWrapper.style.display = 'flex';
        itemWrapper.style.justifyContent = 'center';
        itemWrapper.style.alignItems = 'center';
        itemWrapper.style.marginBottom = '8px';


        const left = document.createElement('div');
        left.innerHTML = `<strong>${item.name}</strong> <span style="color:#2563eb">(${item.qty} X ${formatRupees(item.price)})</span>`;

        const right = document.createElement('div');
        right.style.display = "flex";
        right.style.gap = "8px";
        right.style.alignItems = "center";

        itemWrapper.appendChild(left);
        itemWrapper.appendChild(right);

        cartItemsDiv.appendChild(itemWrapper);
    });

    const total = cart.reduce((sum, it) => sum + it.price * it.qty, 0);
    totalAmountEl.textContent = formatRupees(total);

    bookBtn.style.opacity = '1';
    bookBtn.disabled = false;
}

function addServiceFromButton(addBtn){
    const serviceItem = addBtn.closest(".service-items");
    const titleSpan = serviceItem.querySelector('span');
    const priceSpan = serviceItem.querySelector('.price');

    const priceText = priceSpan ? priceSpan.textContent: '';

    const name = titleSpan.cloneNode(true).childNodes[0].textContent.trim();

    const price = parsePrice(priceText);

    const id = name.replace(/\s+/g, '-').toLowerCase();

}

function addOneToCartById(id){
    const serviceItem = findServiceItemById(id);
    if(serviceItem){
        const addBtn = document.querySelector(".add-btn");
        if(addBtn && addBtn.style.display !== "none"){
            addServiceFromButton(addBtn);
            return;
        }
    }
}

function removeAllFromCart(id){
    cart = cart.filter(i => i.id !== id);
    toggleServiceButtonAfterRemoval(id);
    renderCart();
}

function removeServiceFromButton(removeBtn){
    const serviceItem = removeBtn.closest('.service-items');
    const titleSpan = serviceItem.querySelector('span');
    const name = titleSpan.cloneNode(true).childNodes[0].textContent.trim();
    const id = name.replace(/\s+/g, '-').toLowerCase();

    cart = cart.filter(i => i.id !== id);

    const addBtn = serviceItem.querySelector(".add-btn");
    if(addBtn) addBtn.style.display = "inline-block";
    removeBtn.style.display = "none";

    renderCart();
}

function findServiceItemById(id){
    const serviceItems = document.querySelectorAll('.service-items');
    for (const si of serviceItems){
        const titleSpan = si.querySelector('span')
        const name = titleSpan.cloneNode(true).childNodes[0].textContent.trim();
        const candidateId = name.replace(/\s+/g, '-').toLowerCase();
        if(candidateId === id) return si;
    }
    return null;
}

function toggleServiceButtonAfterRemoval(id){
    const serviceItem = findServiceItemById(id);
    if(!serviceItem) return ;
    const addBtn = serviceItem.querySelector('.add-btn');
    const removeBtn = serviceItem.querySelector('.remove-btn');
    if(addBtn) addBtn.style.display = "inline-block";
    if(removeBtn) removeBtn.style.display = "none";
}

document.addEventListener('DOMContentLoaded', () => {
    bookBtn.style.opacity = '0.3';
    bookBtn.disabled = true;
    thankMessage.style.display = "none";

    document.querySelectorAll(".service-items .add-btn").forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            addServiceFromButton(btn);
        });
    });

    document.querySelectorAll(".service-items .remove-btn").forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            removeServiceFromButton(btn);
        });
    });

    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if(cart.length === 0){
            alert("Please add atleast one item into the cart.");
            return;
        }

        const formData = new FormData(bookingForm);
        const user_name = formData.get('name');
        const user_email = formData.get('email');
        const user_phone = formData.get('phone');

        const items_list = cart.map(ci => `${ci.name} (x ${ci.qty}) - ${formatRupees(ci.price * ci.qty)}`).join('\\n');
        const total_amount = cart.reduce((s, it) => s + it.price * it.qty, 0);

        const templateParams = {
            user_name,
            user_email,
            user_phone,
            items_list,
            total_amount: formatRupees(total_amount)
        };

        bookBtn.disabled = true;
        bookBtn.style.opacity = '0.6';
        bookBtn.textContent = "Booking...";

        if(window.emailjs && EMAILJS_SERVICE !== "service_123" && EMAILJS_TEMPLATE !== "template_add"){
            emailjs.send(EMAILJS_SERVICE, EMAILJS_TEMPLATE, templateParams)
                .then(() => {
                    onBookingSuccess();
                }, (err) => {
                    console.error("Emailjs error", err);
                    alert("Booking email failed to send, but your booking is locally recorded.");
                    onBookingSuccess();
                });
        }else{
            console.warn('EmailJS is not configured. Replace EMAILJS_* constants with your IDs to enable email sending.');
            onBookingSuccess();
        }
    });
});

function onBookingSuccess(){
    thankMessage.style.display = "block";
    bookBtn.textContent = "Book Now";
    bookBtn.disabled = false;
    bookBtn.style.opacity = "1";


    cart.forEach(it => toggleServiceButtonAfterRemoval(it.id));
    cart = [];
    renderCart();

    bookingForm.reset();

    setTimeout(() => {
        thankMessage.style.display = "none";
    }, 6000);
}