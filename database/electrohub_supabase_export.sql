--
-- PostgreSQL database dump
--

\restrict oLFF39jQG4FEaUSrVM7ytKAoGIWIzIxy0JbwMGg8cRfvybaIXCW3az0MBvXBwto

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS cart_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE IF EXISTS ONLY public.testimonials DROP CONSTRAINT IF EXISTS testimonials_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.orders DROP CONSTRAINT IF EXISTS orders_pkey;
ALTER TABLE IF EXISTS ONLY public.order_items DROP CONSTRAINT IF EXISTS order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.newsletter_subscriptions DROP CONSTRAINT IF EXISTS newsletter_subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.newsletter_subscriptions DROP CONSTRAINT IF EXISTS newsletter_subscriptions_email_key;
ALTER TABLE IF EXISTS ONLY public.coupon_codes DROP CONSTRAINT IF EXISTS coupon_codes_pkey;
ALTER TABLE IF EXISTS ONLY public.coupon_codes DROP CONSTRAINT IF EXISTS coupon_codes_code_key;
ALTER TABLE IF EXISTS ONLY public.contact_messages DROP CONSTRAINT IF EXISTS contact_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_slug_key;
ALTER TABLE IF EXISTS ONLY public.categories DROP CONSTRAINT IF EXISTS categories_pkey;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS cart_items_pkey;
ALTER TABLE IF EXISTS public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.testimonials ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.products ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.orders ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.order_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.newsletter_subscriptions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.coupon_codes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.contact_messages ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.categories ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.cart_items ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.users_id_seq;
DROP TABLE IF EXISTS public.users;
DROP SEQUENCE IF EXISTS public.testimonials_id_seq;
DROP TABLE IF EXISTS public.testimonials;
DROP SEQUENCE IF EXISTS public.products_id_seq;
DROP TABLE IF EXISTS public.products;
DROP SEQUENCE IF EXISTS public.orders_id_seq;
DROP TABLE IF EXISTS public.orders;
DROP SEQUENCE IF EXISTS public.order_items_id_seq;
DROP TABLE IF EXISTS public.order_items;
DROP SEQUENCE IF EXISTS public.notifications_id_seq;
DROP TABLE IF EXISTS public.notifications;
DROP SEQUENCE IF EXISTS public.newsletter_subscriptions_id_seq;
DROP TABLE IF EXISTS public.newsletter_subscriptions;
DROP SEQUENCE IF EXISTS public.coupon_codes_id_seq;
DROP TABLE IF EXISTS public.coupon_codes;
DROP SEQUENCE IF EXISTS public.contact_messages_id_seq;
DROP TABLE IF EXISTS public.contact_messages;
DROP SEQUENCE IF EXISTS public.categories_id_seq;
DROP TABLE IF EXISTS public.categories;
DROP SEQUENCE IF EXISTS public.cart_items_id_seq;
DROP TABLE IF EXISTS public.cart_items;
DROP FUNCTION IF EXISTS public.rls_auto_enable();
DROP SCHEMA IF EXISTS public;
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    session_id character varying(255),
    user_id integer,
    product_id integer,
    quantity integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contact_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;


--
-- Name: coupon_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupon_codes (
    id integer NOT NULL,
    code character varying(50) NOT NULL,
    discount_amount numeric(10,2) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: coupon_codes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.coupon_codes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: coupon_codes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.coupon_codes_id_seq OWNED BY public.coupon_codes.id;


--
-- Name: newsletter_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.newsletter_subscriptions (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: newsletter_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.newsletter_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: newsletter_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.newsletter_subscriptions_id_seq OWNED BY public.newsletter_subscriptions.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id integer NOT NULL,
    order_id integer,
    product_id integer,
    quantity integer NOT NULL,
    price numeric(10,2) NOT NULL
);


--
-- Name: order_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id integer NOT NULL,
    user_id integer,
    total_amount numeric(10,2) NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    shipping_address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id integer NOT NULL,
    category_id integer,
    name character varying(255) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    stock integer DEFAULT 0,
    image_path character varying(255),
    rating numeric(2,1) DEFAULT 0.0,
    is_featured boolean DEFAULT false,
    specs jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reviews_data jsonb DEFAULT '[]'::jsonb,
    is_new boolean DEFAULT false,
    brand character varying(100)
);


--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: testimonials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.testimonials (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    role character varying(100),
    avatar_initials character varying(4),
    rating integer DEFAULT 5,
    message text NOT NULL,
    product character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT testimonials_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: testimonials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.testimonials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: testimonials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.testimonials_id_seq OWNED BY public.testimonials.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) DEFAULT 'customer'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    phone character varying(50),
    address text,
    reset_token character varying(255),
    reset_token_expiry timestamp without time zone
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: contact_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);


--
-- Name: coupon_codes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_codes ALTER COLUMN id SET DEFAULT nextval('public.coupon_codes_id_seq'::regclass);


--
-- Name: newsletter_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.newsletter_subscriptions_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: order_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: testimonials id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials ALTER COLUMN id SET DEFAULT nextval('public.testimonials_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cart_items (id, session_id, user_id, product_id, quantity, created_at) FROM stdin;
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories (id, name, slug) FROM stdin;
5	Computing	computing
6	Acoustics	acoustics
7	Mobile	mobile
8	Wearables	wearables
9	Gaming	gaming
10	Smart Home	smart-home
15	Gaming & VR	gaming-vr
\.


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contact_messages (id, name, email, subject, message, created_at) FROM stdin;
\.


--
-- Data for Name: coupon_codes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.coupon_codes (id, code, discount_amount, is_active, created_at) FROM stdin;
1	ELECTROHUB10	50.00	t	2026-04-30 20:12:05.255805
2	WELCOME20	100.00	t	2026-04-30 20:12:05.255805
3	SAVE15	75.00	t	2026-04-30 20:12:05.255805
\.


--
-- Data for Name: newsletter_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.newsletter_subscriptions (id, email, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, message, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.order_items (id, order_id, product_id, quantity, price) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orders (id, user_id, total_amount, status, shipping_address, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, category_id, name, description, price, stock, image_path, rating, is_featured, specs, created_at, reviews_data, is_new, brand) FROM stdin;
48	5	Dell XPS 15 OLED	Next-level performance with a stunning 15.6-inch OLED touchscreen display, Intel Core i7, and NVIDIA RTX 4070 graphics.	1899.99	12	dell-xps-15.avif	4.0	f	\N	2026-04-25 18:57:14.492553	[{"text": "It's okay, nothing special but it works.", "author": "Chris P.", "rating": 5, "user_id": 4}, {"text": "Really solid product, works exactly as described.", "author": "Amanda J.", "rating": 3, "user_id": 5}]	f	Dell
47	5	Apple MacBook Air M3 (13-inch)	Supercharged by the M3 chip. Features a Liquid Retina display, up to 18 hours of battery life.	1099.00	45	macbook-air-m3.webp	3.7	t	\N	2026-04-25 18:57:13.507239	[{"text": "Five stars! Best purchase I've made this year.", "author": "Emily R.", "rating": 3, "user_id": 6}, {"text": "A bit disappointed with the battery life, but otherwise good.", "author": "Chris P.", "rating": 5, "user_id": 4}, {"text": "Incredible build quality. Feels very premium.", "author": "David L.", "rating": 3, "user_id": 7}]	f	Apple
50	5	Apple iPad Pro 12.9-inch (M2)	Astonishing performance. Incredibly advanced displays. Superfast wireless connectivity. Next-level Apple Pencil capabilities.	1099.00	60	ipad-pro-m2.webp	3.5	t	\N	2026-04-25 18:57:15.064269	[{"text": "Really solid product, works exactly as described.", "author": "Jessica W.", "rating": 3, "user_id": 8}, {"text": "A bit disappointed with the battery life, but otherwise good.", "author": "Amanda J.", "rating": 3, "user_id": 5}, {"text": "Not bad, it does the job.", "author": "Emily R.", "rating": 3, "user_id": 6}, {"text": "Not bad, it does the job.", "author": "Jessica W.", "rating": 5, "user_id": 8}]	f	Apple
49	5	Asus ROG Zephyrus G14	The ultimate compact gaming laptop featuring an AMD Ryzen 9 processor, RTX 4060 GPU, and an incredible ROG Nebula HDR Display.	1599.00	20	asus-rog-g14.webp	3.2	f	\N	2026-04-25 18:57:14.77236	[{"text": "Fantastic value for money. Highly recommended.", "author": "Jessica W.", "rating": 4, "user_id": 8}, {"text": "Not bad, it does the job.", "author": "Chris P.", "rating": 3, "user_id": 4}, {"text": "Not bad, it does the job.", "author": "Amanda J.", "rating": 3, "user_id": 5}, {"text": "A bit disappointed with the battery life, but otherwise good.", "author": "Michael B.", "rating": 3, "user_id": 9}, {"text": "A bit disappointed with the battery life, but otherwise good.", "author": "Amanda J.", "rating": 3, "user_id": 5}]	f	Asus
66	15	Nintendo Switch OLED Model	Play at home or on the go with a vibrant 7-inch OLED screen, a wide adjustable stand, and enhanced audio.	349.99	90	switch-oled.webp	3.3	t	\N	2026-04-25 18:57:20.27526	[{"text": "Five stars! Best purchase I've made this year.", "author": "Michael B.", "rating": 3, "user_id": 9}, {"text": "Exceeded my expectations. Would definitely recommend to anyone.", "author": "Jessica W.", "rating": 4, "user_id": 8}, {"text": "Five stars! Best purchase I've made this year.", "author": "Jordan K.", "rating": 3, "user_id": 10}]	f	Nintendo
65	15	Xbox Series X 1TB Console	The fastest, most powerful Xbox ever. Explore rich new worlds with 12 teraflops of raw graphic processing power and 4K gaming.	499.99	40	xbox-series-x.webp	3.3	f	\N	2026-04-25 18:57:19.98358	[{"text": "Incredible build quality. Feels very premium.", "author": "Ryan S.", "rating": 4, "user_id": 11}, {"text": "Incredible build quality. Feels very premium.", "author": "Jessica W.", "rating": 3, "user_id": 8}, {"text": "Absolutely love it. Great quality and fast shipping!", "author": "Emily R.", "rating": 3, "user_id": 6}]	f	Microsoft
51	6	Sony WH-1000XM5 Wireless Headphones	Industry-leading noise cancellation, crystal clear hands-free calling, and up to 30 hours of battery life.	398.00	120	sony-wh1000xm5.webp	5.0	t	\N	2026-04-25 18:57:15.349828	[{"text": "Incredible build quality. Feels very premium.", "author": "Alex T.", "rating": 5, "user_id": 12}, {"text": "Absolutely love it. Great quality and fast shipping!", "author": "Alex T.", "rating": 5, "user_id": 12}]	f	Sony
53	6	Bose QuietComfort Ultra Earbuds	World-class noise cancellation, spatial audio for more immersive listening, and custom-tune technology that adapts sound to your ears.	299.00	85	bose-qc-ultra.webp	3.0	f	\N	2026-04-25 18:57:15.923223	[{"text": "Exceeded my expectations. Would definitely recommend to anyone.", "author": "Sarah M.", "rating": 3, "user_id": 13}]	f	Bose
55	7	Apple iPhone 15 Pro Max	Forged in titanium. Features the breakthrough A17 Pro chip, a customizable Action button, and the pro camera system.	1199.00	85	iphone-15.webp	5.0	t	\N	2026-04-25 18:57:16.49932	[{"text": "Really solid product, works exactly as described.", "author": "Amanda J.", "rating": 5, "user_id": 5}]	f	Apple
57	7	Google Pixel 8 Pro	Engineered by Google, featuring the new Tensor G3 chip, advanced AI photography tools, and a polished aluminum frame.	999.00	45	pixel-8-pro.webp	4.8	f	\N	2026-04-25 18:57:17.076706	[{"text": "Decent for the price, but could be better.", "author": "Michael B.", "rating": 5, "user_id": 9}, {"text": "Absolutely love it. Great quality and fast shipping!", "author": "Amanda J.", "rating": 5, "user_id": 5}, {"text": "Exceeded my expectations. Would definitely recommend to anyone.", "author": "Michael B.", "rating": 5, "user_id": 9}, {"text": "Not bad, it does the job.", "author": "Sarah M.", "rating": 5, "user_id": 13}, {"text": "Fantastic value for money. Highly recommended.", "author": "Alex T.", "rating": 4, "user_id": 12}]	f	Google
63	15	Sony PlayStation 5 Slim Console	Experience lightning-fast loading with an ultra-high-speed SSD, deeper immersion with haptic feedback.	499.00	50	ps5.jpg	3.0	t	\N	2026-04-25 18:57:19.402198	[{"text": "Five stars! Best purchase I've made this year.", "author": "Alex T.", "rating": 3, "user_id": 12}]	f	Sony
64	15	Meta Quest 3 (128GB)	Breakthrough mixed reality headset with full-color passthrough and massive resolution leaps over the previous generation.	499.99	80	meta-quest-3.jpg	4.0	f	\N	2026-04-25 18:57:19.682221	[{"text": "Incredible build quality. Feels very premium.", "author": "Emily R.", "rating": 4, "user_id": 6}, {"text": "Really solid product, works exactly as described.", "author": "Jessica W.", "rating": 4, "user_id": 8}]	f	Meta
68	10	Ring Video Doorbell Pro 2	Premium wired video doorbell with 1536p HD Head-to-Toe Video, 3D Motion Detection, and built-in Alexa Greetings.	249.99	35	ring-doorbell-pro-2.webp	4.0	f	\N	2026-04-25 18:57:20.850682	[{"text": "It's okay, nothing special but it works.", "author": "Jessica W.", "rating": 5, "user_id": 8}, {"text": "Decent for the price, but could be better.", "author": "Jessica W.", "rating": 4, "user_id": 8}, {"text": "Five stars! Best purchase I've made this year.", "author": "Chris P.", "rating": 3, "user_id": 4}]	f	Ring
59	8	Apple Watch Series 9	Powerful fitness and health tracking with a brilliant always-on display, ECG monitoring, and crash detection.	399.00	109	apple-watch.webp	4.0	t	\N	2026-04-25 18:57:17.650817	[{"text": "A bit disappointed with the battery life, but otherwise good.", "author": "Jessica W.", "rating": 4, "user_id": 8}, {"date": "2026-04-26T06:43:56.555Z", "text": "NA", "author": "ali", "rating": 2, "userId": 3}]	f	Apple
52	6	Apple AirPods Pro (2nd Gen)	Rich audio experience with Active Noise Cancellation, Adaptive Transparency, and personalized Spatial Audio.	249.00	200	airpods-pro.webp	3.8	f	\N	2026-04-25 18:57:15.637611	[{"text": "Not bad, it does the job.", "author": "Chris P.", "rating": 5, "user_id": 4}, {"text": "Fantastic value for money. Highly recommended.", "author": "Ryan S.", "rating": 3, "user_id": 11}, {"text": "Incredible build quality. Feels very premium.", "author": "Emily R.", "rating": 3, "user_id": 6}, {"text": "It's okay, nothing special but it works.", "author": "Sarah M.", "rating": 3, "user_id": 13}, {"text": "Really solid product, works exactly as described.", "author": "Amanda J.", "rating": 4, "user_id": 5}, {"text": "A bit disappointed with the battery life, but otherwise good.", "author": "Sarah M.", "rating": 5, "user_id": 13}]	f	Apple
54	6	Sennheiser Momentum 4 Wireless	Signature sound with outstanding music quality, adaptive noise cancellation, and a massive 60-hour battery life.	349.95	40	sennheiser-momentum-4.webp	3.8	f	\N	2026-04-25 18:57:16.213783	[{"text": "It's okay, nothing special but it works.", "author": "Jordan K.", "rating": 3, "user_id": 10}, {"text": "Absolutely love it. Great quality and fast shipping!", "author": "Jessica W.", "rating": 5, "user_id": 8}, {"text": "Really solid product, works exactly as described.", "author": "Emily R.", "rating": 4, "user_id": 6}, {"text": "Not bad, it does the job.", "author": "Sarah M.", "rating": 3, "user_id": 13}]	f	Sennheiser
56	7	Samsung Galaxy S24 Ultra	AI-powered smartphone with a massive 200MP camera, built-in S-Pen, and a super-smooth 6.8" 120Hz display.	1299.99	65	samsung-s24.webp	3.8	f	\N	2026-04-25 18:57:16.790025	[{"text": "Not bad, it does the job.", "author": "Jordan K.", "rating": 4, "user_id": 10}, {"text": "A bit disappointed with the battery life, but otherwise good.", "author": "Jessica W.", "rating": 4, "user_id": 8}, {"text": "Exceeded my expectations. Would definitely recommend to anyone.", "author": "Amanda J.", "rating": 4, "user_id": 5}, {"text": "Incredible build quality. Feels very premium.", "author": "Emily R.", "rating": 3, "user_id": 6}, {"text": "It's okay, nothing special but it works.", "author": "Amanda J.", "rating": 3, "user_id": 5}, {"text": "It's okay, nothing special but it works.", "author": "Jessica W.", "rating": 5, "user_id": 8}]	f	Samsung
58	7	Samsung Galaxy Z Fold 5	Unfold a massive 7.6" main display that transforms your phone into a tablet for ultimate productivity and immersive gaming.	1799.99	15	galaxy-z-fold-5.webp	4.2	t	\N	2026-04-25 18:57:17.363352	[{"text": "Fantastic value for money. Highly recommended.", "author": "David L.", "rating": 4, "user_id": 7}, {"text": "Really solid product, works exactly as described.", "author": "David L.", "rating": 5, "user_id": 7}, {"text": "Really solid product, works exactly as described.", "author": "Jordan K.", "rating": 4, "user_id": 10}, {"text": "It's okay, nothing special but it works.", "author": "Amanda J.", "rating": 3, "user_id": 5}, {"text": "Five stars! Best purchase I've made this year.", "author": "Amanda J.", "rating": 5, "user_id": 5}]	f	Samsung
60	8	Garmin Fenix 7 Pro Sapphire Solar	Ultimate multisport GPS smartwatch with solar charging capabilities and advanced performance metrics.	899.99	25	garmin-fenix.webp	3.8	f	\N	2026-04-25 18:57:18.272656	[{"text": "A bit disappointed with the battery life, but otherwise good.", "author": "Amanda J.", "rating": 3, "user_id": 5}, {"text": "Incredible build quality. Feels very premium.", "author": "David L.", "rating": 4, "user_id": 7}, {"text": "Five stars! Best purchase I've made this year.", "author": "Ryan S.", "rating": 5, "user_id": 11}, {"text": "Not bad, it does the job.", "author": "Jessica W.", "rating": 4, "user_id": 8}, {"text": "Incredible build quality. Feels very premium.", "author": "Chris P.", "rating": 4, "user_id": 4}, {"text": "It's okay, nothing special but it works.", "author": "Emily R.", "rating": 3, "user_id": 6}]	f	Garmin
61	8	Samsung Galaxy Watch 6 Classic	Timeless design with a rotating bezel. Comprehensive health tracking, advanced sleep coaching, and seamless Galaxy ecosystem integration.	399.99	55	galaxy-watch-6.webp	3.5	f	\N	2026-04-25 18:57:18.729014	[{"text": "Really solid product, works exactly as described.", "author": "David L.", "rating": 4, "user_id": 7}, {"text": "It's okay, nothing special but it works.", "author": "Jessica W.", "rating": 3, "user_id": 8}]	f	Samsung
62	8	Oura Ring Gen3 Horizon	Sleek, titanium smart ring that provides highly accurate, personalized health data including sleep analysis, heart rate, and readiness scores.	349.00	30	oura-ring-3.webp	4.2	f	\N	2026-04-25 18:57:19.095188	[{"text": "Exceeded my expectations. Would definitely recommend to anyone.", "author": "Amanda J.", "rating": 4, "user_id": 5}, {"text": "It's okay, nothing special but it works.", "author": "Jessica W.", "rating": 5, "user_id": 8}, {"text": "Incredible build quality. Feels very premium.", "author": "Amanda J.", "rating": 5, "user_id": 5}, {"text": "Fantastic value for money. Highly recommended.", "author": "David L.", "rating": 3, "user_id": 7}, {"text": "Really solid product, works exactly as described.", "author": "Emily R.", "rating": 4, "user_id": 6}, {"text": "Fantastic value for money. Highly recommended.", "author": "Chris P.", "rating": 4, "user_id": 4}]	f	Oura
69	10	Amazon Echo Studio	High-fidelity smart speaker with 3D audio and Alexa. Features 5 speakers that produce powerful bass and crisp highs.	199.99	75	echo-studio.webp	4.0	f	\N	2026-04-25 18:57:21.153701	[{"text": "Fantastic value for money. Highly recommended.", "author": "Emily R.", "rating": 5, "user_id": 6}, {"text": "Really solid product, works exactly as described.", "author": "Michael B.", "rating": 4, "user_id": 9}, {"text": "A bit disappointed with the battery life, but otherwise good.", "author": "Sarah M.", "rating": 3, "user_id": 13}]	f	Amazon
67	10	Philips Hue White & Color Ambiance Starter Kit	Transform your home with 16 million colors and shades of white light. Includes Hub and 3 standard A19 bulbs.	179.99	60	philips-hue.webp	4.0	t	\N	2026-04-25 18:57:20.563631	[{"text": "Fantastic value for money. Highly recommended.", "author": "Chris P.", "rating": 5, "user_id": 4}, {"text": "Decent for the price, but could be better.", "author": "Sarah M.", "rating": 4, "user_id": 13}, {"text": "Exceeded my expectations. Would definitely recommend to anyone.", "author": "David L.", "rating": 3, "user_id": 7}, {"text": "Incredible build quality. Feels very premium.", "author": "Michael B.", "rating": 5, "user_id": 9}, {"text": "Incredible build quality. Feels very premium.", "author": "Sarah M.", "rating": 4, "user_id": 13}, {"text": "Incredible build quality. Feels very premium.", "author": "Emily R.", "rating": 3, "user_id": 6}]	f	Philips
\.


--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.testimonials (id, name, role, avatar_initials, rating, message, product, created_at) FROM stdin;
1	Ahmed Al-Rashid	Software Engineer	AA	5	The MacBook Air M3 is an absolute beast. Silent, fast, and the battery lasts my entire workday. Best laptop I have ever owned.	MacBook Air M3	2026-04-24 11:14:57.870718
2	Sarah Mitchell	Graphic Designer	SM	5	Sony WH-1000XM5 headphones are incredible. I use them during long design sessions and the noise cancellation lets me focus completely.	Sony WH-1000XM5	2026-04-24 11:14:57.870718
3	Omar Khalil	University Student	OK	5	Got the iPhone 15 Pro from ElectroHub and I am blown away by the camera quality. Fast delivery and great packaging too!	iPhone 15 Pro	2026-04-24 11:14:57.870718
4	Emily Chen	Content Creator	EC	5	The AirPods Pro 2 are life-changing for someone who records content daily. The Adaptive ANC is genuinely magical.	AirPods Pro 2nd Gen	2026-04-24 11:14:57.870718
5	James Thornton	IT Consultant	JT	4	Picked up the Dell XPS 15 OLED for work and the display is stunning. The OLED panel makes everything look vibrant. Very happy with my purchase.	Dell XPS 15 OLED	2026-04-24 11:14:57.870718
6	Lina Hamdan	Fitness Trainer	LH	5	My Garmin Fenix 7X has completely transformed how I track my training. The battery lasts nearly two weeks — no charging anxiety!	Garmin Fenix 7X	2026-04-24 11:14:57.870718
7	Carlos Rivera	Gamer	CR	5	The PS5 I got from ElectroHub was in perfect condition and arrived faster than expected. Customer service was excellent too.	PlayStation 5	2026-04-24 11:14:57.870718
8	Nour Abdallah	Entrepreneur	NA	5	Ordered the Samsung S26 Ultra and the camera is on another level. The S Pen is incredibly useful for signing documents on the go.	Samsung Galaxy S26 Ultra	2026-04-24 11:14:57.870718
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, role, created_at, phone, address, reset_token, reset_token_expiry) FROM stdin;
1	System Admin	admin@electrohub.com	$2b$10$CzG34ATfaqFA5D43kJsNYey5jUrOcpXh7g.ZfnUAiNkc3lV75ZPE2	admin	2026-04-24 11:44:51.700705	\N	\N	\N	\N
\.


--
-- Name: cart_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cart_items_id_seq', 1, false);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 22, true);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contact_messages_id_seq', 3, true);


--
-- Name: coupon_codes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.coupon_codes_id_seq', 3, true);


--
-- Name: newsletter_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.newsletter_subscriptions_id_seq', 5, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: order_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_items_id_seq', 3, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 3, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.products_id_seq', 69, true);


--
-- Name: testimonials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.testimonials_id_seq', 8, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 13, true);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: coupon_codes coupon_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_codes
    ADD CONSTRAINT coupon_codes_code_key UNIQUE (code);


--
-- Name: coupon_codes coupon_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupon_codes
    ADD CONSTRAINT coupon_codes_pkey PRIMARY KEY (id);


--
-- Name: newsletter_subscriptions newsletter_subscriptions_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscriptions
    ADD CONSTRAINT newsletter_subscriptions_email_key UNIQUE (email);


--
-- Name: newsletter_subscriptions newsletter_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.newsletter_subscriptions
    ADD CONSTRAINT newsletter_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: testimonials testimonials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.testimonials
    ADD CONSTRAINT testimonials_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: cart_items cart_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: cart_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: contact_messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

--
-- Name: coupon_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_subscriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: testimonials; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict oLFF39jQG4FEaUSrVM7ytKAoGIWIzIxy0JbwMGg8cRfvybaIXCW3az0MBvXBwto

