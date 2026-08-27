import { createRouter, createWebHistory } from "vue-router";
import { getToken } from "@/utils/auth.ts";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "Login",
      component: () => import("../views/Login.vue"),
    },
    {
      path: "/register",
      name: "Register",
      component: () => import("../views/Register.vue"),
    },
    {
      path: "/search",
      name: "Search",
      component: () => import("../views/Search.vue"),
    },
    {
      path: "/prodinfo",
      name: "ProdInfo",
      component: () => import("../views/ProdInfo.vue"),
    },
    {
      path: "/",
      component: () => import("../components/Layout.vue"),
      redirect: "/home",
      children: [
        {
          path: "home",
          name: "Home",
          component: () => import("../views/Home.vue"),
        },
        {
          path: "category",
          name: "Category",
          component: () => import("../views/Category.vue"),
        },
        {
          path: "cart",
          name: "Cart",
          component: () => import("../views/Cart.vue"),
        },
        {
          path: "mine",
          name: "Mine",
          component: () => import("../views/Mine.vue"),
        },
      ],
    },
    {
      path: "/order",
      name: "Order",
      component: () => import("../views/Order.vue"),
    },
    {
      path: "/address",
      name: "Address",
      component: () => import("../views/Address.vue"),
    },
    {
      path: "/myorder",
      name: "MyOrder",
      component: () => import("../views/MyOrder.vue"),
    },
  ],
});

const whiteList = ["/login", "/register"];

router.beforeEach((to, from) => {
  const token = getToken();
  if (!token && !whiteList.includes(to.path)) {
    return {
      path: "/login",
    };
  }
  return true;
});

export default router;
