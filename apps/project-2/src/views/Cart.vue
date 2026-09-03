<template>
  <main class="cart-page">
    <van-nav-bar class="cart-nav" title="购物车">
      <template #right>
        <button
          v-if="cartGroups.length"
          class="cart-nav__clear"
          type="button"
          :disabled="isClearing"
          @click="clearCart"
        >
          {{ isClearing ? "清空中" : "清空" }}
        </button>
      </template>
    </van-nav-bar>

    <van-cell
      class="cart-address"
      :title="`默认地址：${addressText}`"
      is-link
      clickable
      :aria-label="`当前收货地址：${addressText}`"
      @click="router.push('/address')"
    >
      <template #icon>
        <span class="cart-address__pin" aria-hidden="true"
          ><van-icon name="location"
        /></span>
      </template>
    </van-cell>

    <section class="cart-content" aria-live="polite" :aria-busy="isLoading">
      <SkeletonList
        v-if="isLoading"
        class="cart-skeleton"
        :count="2"
        avatar-size="0.853333rem"
      />

      <van-empty
        v-else-if="!cartGroups.length"
        class="cart-empty"
        description="购物车还是空的"
      >
        <van-button round class="cart-empty__button" to="/home"
          >去逛逛</van-button
        >
      </van-empty>

      <section
        v-for="group in cartGroups"
        v-else
        :key="group.key"
        class="shop-group"
        :aria-label="`${group.shopName}的商品`"
      >
        <header class="shop-group__header">
          <van-checkbox
            :model-value="isGroupChecked(group)"
            :indeterminate="isGroupIndeterminate(group)"
            icon-size="19px"
            checked-color="#c9432e"
            :aria-label="`选择店铺：${group.shopName}`"
            @update:model-value="(checked) => toggleGroup(group, checked)"
          />
          <van-icon name="shop-o" class="shop-group__icon" aria-hidden="true" />
          <h2 class="shop-group__name">{{ group.shopName }}</h2>
          <span class="shop-group__count">{{ group.items.length }} 件</span>
        </header>

        <van-swipe-cell
          v-for="item in group.items"
          :key="item.basketId"
          class="cart-swipe"
          :before-close="beforeSwipeClose"
        >
          <div class="cart-item">
            <van-checkbox
              v-model="item.checked"
              class="cart-item__checkbox"
              icon-size="20px"
              checked-color="#c9432e"
              :aria-label="`选择商品：${item.prodName}`"
            />

            <van-card
              class="cart-card"
              :thumb="item.pic"
              :title="item.prodName"
              :desc="item.skuName || '默认规格'"
              :price="formatPrice(item.price)"
              :origin-price="
                item.oriPrice > item.price
                  ? formatPrice(item.oriPrice)
                  : undefined
              "
              :thumb-link="undefined"
            >
              <template #footer>
                <van-stepper
                  v-model="item.prodCount"
                  class="cart-card__stepper"
                  :min="1"
                  :max="99"
                  integer
                  :disabled="updatingIds.has(item.basketId)"
                  :before-change="(value) => beforeQuantityChange(item, value)"
                  :aria-label="`${item.prodName}的数量`"
                />
              </template>
            </van-card>
          </div>

          <template #right>
            <van-button
              square
              class="cart-swipe__delete"
              text="删除"
              :loading="deletingIds.has(item.basketId)"
              loading-text="删除"
              @click="deleteItem(item)"
            />
          </template>
        </van-swipe-cell>
      </section>
    </section>

    <van-submit-bar
      v-if="cartGroups.length"
      class="cart-submit"
      :price="selectedTotal"
      :loading="isCalculating"
      :disabled="!selectedBasketIds.length || isCalculating"
      button-text="提交订单"
      button-color="#c9432e"
      @submit="submitOrder"
    >
      <van-checkbox
        v-model="allChecked"
        icon-size="20px"
        checked-color="#c9432e"
        aria-label="选择全部商品"
      >
        全选
      </van-checkbox>
      <span v-if="paySummary.subtractMoney > 0" class="cart-submit__saving">
        已省 ¥{{ formatPrice(paySummary.subtractMoney) }}
      </span>
    </van-submit-bar>
  </main>
</template>

<script setup lang="ts">
import SkeletonList from "../components/SkeletonList.vue";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { showFailToast, showSuccessToast, showToast } from "vant";
import "vant/es/toast/style";
import {
  changeItemInfo,
  deleteAllInfo,
  deleteItemInfo,
  shopCartInfo,
  totalPayInfo,
} from "../api/cart";
import { addrListInfo } from "../api/address";

interface CartItem {
  basketId: number;
  prodId: number;
  skuId: number;
  shopId: number;
  prodName: string;
  skuName: string;
  price: number;
  oriPrice: number;
  prodCount: number;
  checked: boolean;
  pic: string;
}
interface CartGroup {
  key: string;
  shopId: number;
  shopName: string;
  items: CartItem[];
}
type CartApiItem = Omit<
  CartItem,
  "checked" | "price" | "oriPrice" | "prodCount"
> & {
  price?: string | number;
  oriPrice?: string | number;
  prodCount?: string | number;
};
interface CartShop {
  shopId: number;
  shopName: string;
  shopCartItemDiscounts?: { shopCartItems?: CartApiItem[] }[];
}
interface CartAddress {
  province: string;
  city: string;
  area: string;
  addr: string;
  commonAddr: number;
}

const DEFAULT_ADDRESS = "山西省太原市小店区001";
const DEFAULT_SHOP_NAME = "商城小店1号";

const router = useRouter();
const addressText = ref(DEFAULT_ADDRESS);
const cartGroups = ref<CartGroup[]>([]);
const isLoading = ref(true);
const isClearing = ref(false);
const isCalculating = ref(false);
const deletingIds = ref(new Set());
const updatingIds = ref(new Set());
const payRequestId = ref(0);
const paySummary = ref({
  totalMoney: 0,
  finalMoney: 0,
  subtractMoney: 0,
  count: 0,
});

const allItems = computed(() =>
  cartGroups.value.flatMap((group) => group.items),
);

const selectedBasketIds = computed(() =>
  allItems.value.filter((item) => item.checked).map((item) => item.basketId),
);

const allChecked = computed({
  get: () =>
    allItems.value.length > 0 && allItems.value.every((item) => item.checked),
  set: (checked) => {
    allItems.value.forEach((item) => {
      item.checked = checked;
    });
  },
});

const selectedTotal = computed(() =>
  Math.round(paySummary.value.finalMoney * 100),
);

watch(
  () => selectedBasketIds.value.join(","),
  () => refreshPayInfo(),
);

onMounted(() => {
  loadCart();
  loadAddress();
});

const formatPrice = (price: number) => Number(price || 0).toFixed(2);

const formatCartGroups = (shops: CartShop[] = []) => {
  const groupedShops = new Map<string, CartGroup>();

  shops.forEach((shop) => {
    const key = String(shop.shopId ?? shop.shopName ?? DEFAULT_SHOP_NAME);
    const currentGroup = groupedShops.get(key) ?? {
      key,
      shopId: shop.shopId,
      shopName: shop.shopName || DEFAULT_SHOP_NAME,
      items: [],
    };

    shop.shopCartItemDiscounts?.forEach((discountGroup) => {
      discountGroup.shopCartItems?.forEach((item) => {
        currentGroup.items.push({
          basketId: item.basketId,
          prodId: item.prodId,
          skuId: item.skuId,
          shopId: item.shopId,
          prodName: item.prodName,
          skuName: item.skuName,
          price: Number(item.price || 0),
          oriPrice: Number(item.oriPrice || 0),
          prodCount: Number(item.prodCount || 1),
          checked: false,
          pic: item.pic,
        });
      });
    });

    groupedShops.set(key, currentGroup);
  });

  return [...groupedShops.values()].filter((group) => group.items.length);
};

const loadCart = async () => {
  isLoading.value = true;

  try {
    const res = await shopCartInfo({});

    if (!res.success) {
      throw new Error(res.msg || "获取购物车失败");
    }

    cartGroups.value = formatCartGroups(res.data ?? []);
  } catch (error) {
    cartGroups.value = [];
    showFailToast(error instanceof Error ? error.message : "获取购物车失败");
  } finally {
    isLoading.value = false;
  }
};

const formatAddress = (address: CartAddress) =>
  [address.province, address.city, address.area, address.addr]
    .filter(Boolean)
    .join("");

const loadAddress = async () => {
  addressText.value = DEFAULT_ADDRESS;

  try {
    const res = await addrListInfo();
    const addresses = res.data;

    if (!res.success || !addresses?.length) return;

    const address =
      addresses.find((item: CartAddress) => item.commonAddr === 1) ??
      addresses[0];
    const fullAddress = address ? formatAddress(address) : "";

    if (fullAddress) addressText.value = fullAddress;
  } catch (error) {
    console.error("获取收货地址失败：", error);
  }
};

const isGroupChecked = (group: CartGroup) =>
  group.items.length > 0 && group.items.every((item) => item.checked);

const isGroupIndeterminate = (group: CartGroup) => {
  const checkedCount = group.items.filter((item) => item.checked).length;
  return checkedCount > 0 && checkedCount < group.items.length;
};

const toggleGroup = (group: CartGroup, checked: boolean) => {
  group.items.forEach((item) => {
    item.checked = checked;
  });
};

const resetPaySummary = () => {
  paySummary.value = {
    totalMoney: 0,
    finalMoney: 0,
    subtractMoney: 0,
    count: 0,
  };
};

const refreshPayInfo = async () => {
  const basketIds = [...selectedBasketIds.value];
  const currentRequestId = ++payRequestId.value;

  if (!basketIds.length) {
    resetPaySummary();
    isCalculating.value = false;
    return;
  }

  isCalculating.value = true;

  try {
    const res = await totalPayInfo(basketIds);

    if (currentRequestId !== payRequestId.value) return;
    if (!res.success) throw new Error(res.msg || "价格计算失败");

    paySummary.value = {
      totalMoney: Number(res.data?.totalMoney || 0),
      finalMoney: Number(res.data?.finalMoney || 0),
      subtractMoney: Number(res.data?.subtractMoney || 0),
      count: Number(res.data?.count || 0),
    };
  } catch (error) {
    if (currentRequestId !== payRequestId.value) return;
    resetPaySummary();
    showFailToast(error instanceof Error ? error.message : "价格计算失败");
  } finally {
    if (currentRequestId === payRequestId.value) {
      isCalculating.value = false;
    }
  }
};

const beforeQuantityChange = async (item: CartItem, value: string | number) => {
  const nextCount = Number(value);
  const difference = nextCount - item.prodCount;

  if (!difference) return true;
  if (updatingIds.value.has(item.basketId)) return false;

  updatingIds.value.add(item.basketId);

  try {
    const res = await changeItemInfo({
      basketId: item.basketId,
      prodId: item.prodId,
      skuId: item.skuId,
      shopId: item.shopId,
      count: difference,
      distributionCardNo: "",
    });

    if (!res.success) throw new Error(res.msg || "修改数量失败");

    if (item.checked) await refreshPayInfo();
    return true;
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : "修改数量失败");
    return false;
  } finally {
    updatingIds.value.delete(item.basketId);
  }
};

const removeLocalItems = (basketIds: number[]) => {
  const idSet = new Set(basketIds);

  cartGroups.value = cartGroups.value
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !idSet.has(item.basketId)),
    }))
    .filter((group) => group.items.length);
};

const deleteItem = async (item: CartItem) => {
  if (deletingIds.value.has(item.basketId)) return;

  deletingIds.value.add(item.basketId);

  try {
    const res = await deleteItemInfo([item.basketId]);

    if (!res.success) throw new Error(res.msg || "删除商品失败");

    removeLocalItems([item.basketId]);
    showSuccessToast("已删除");
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : "删除商品失败");
  } finally {
    deletingIds.value.delete(item.basketId);
  }
};

const clearCart = async () => {
  isClearing.value = true;

  try {
    const res = await deleteAllInfo();

    if (!res.success) throw new Error(res.msg || "清空购物车失败");

    cartGroups.value = [];
    resetPaySummary();
    showSuccessToast("购物车已清空");
  } catch (error) {
    showFailToast(error instanceof Error ? error.message : "清空购物车失败");
  } finally {
    isClearing.value = false;
  }
};

const beforeSwipeClose = ({ position }: { position: string }) =>
  position !== "right";

const submitOrder = () => {
  if (!selectedBasketIds.value.length) {
    showToast("请先选择商品");
    return;
  }

  sessionStorage.setItem(
    "confirm",
    JSON.stringify({
      basketIds: selectedBasketIds.value,
      addrId: 0,
      userChangeCoupon: 0,
      couponIds: [],
    }),
  );
  router.push("/order");
};
</script>

<style scoped lang="scss">
.cart-page {
  --cart-accent: #c9432e;
  --cart-accent-dark: #ad3524;
  --cart-accent-soft: #fff0eb;
  --cart-ink: #2d2926;
  --cart-muted: #716b66;
  --cart-line: #e9e3dd;
  --cart-paper: #fff;
  --cart-canvas: #f7f5f2;

  --van-primary-color: var(--cart-accent);
  --van-text-color: var(--cart-ink);
  --van-text-color-2: var(--cart-muted);
  --van-border-color: var(--cart-line);
  --van-card-price-color: var(--cart-accent);
  --van-submit-bar-price-color: var(--cart-accent);

  position: relative;
  min-height: calc(100dvh - 100px);
  padding-bottom: 236px;
  overflow-x: hidden;
  color: var(--cart-ink);
  background: var(--cart-canvas);
}

.cart-nav {
  height: 96px;
  background: rgba(255, 255, 255, 0.96);

  &::after {
    border-color: var(--cart-line);
  }

  :deep(.van-nav-bar__title) {
    color: var(--cart-ink);
    font-size: 36px;
    font-weight: 700;
    letter-spacing: 4px;
  }

  &__clear {
    padding: 16px 0 16px 28px;
    color: var(--cart-muted);
    font-size: 26px;
    background: transparent;
    border: 0;

    &:disabled {
      opacity: 0.45;
    }
  }
}

.cart-address {
  width: calc(100% - 0.64rem);
  margin: 0.266667rem 0.32rem 0;
  min-height: 140px;
  padding: 34px 36px;
  align-items: center;
  background: var(--cart-paper);
  border: 0.026667rem solid rgba(45, 41, 38, 0.04);
  border-radius: 0.266667rem;

  &::after {
    display: none;
  }

  &__pin {
    position: relative;
    width: 40px;
    margin-right: 20px;
    color: var(--cart-accent);
    font-size: 26px;
  }

  :deep(.van-cell__title) {
    overflow: hidden;
    color: var(--cart-ink);
    font-size: 28px;
    font-weight: 600;
    line-height: 44px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.van-cell__right-icon) {
    color: #a49d97;
    font-size: 34px;
  }
}

.cart-content {
  padding: 0.266667rem 0.32rem 0;
}

.cart-skeleton {
  --skeleton-card-gap: 0.32rem;
  --skeleton-card-padding: 0.64rem 0.853333rem;
  --skeleton-card-background: var(--cart-paper);
  --skeleton-card-radius: 0.32rem;
  --skeleton-row-height: 0.426667rem;
}

.cart-empty {
  min-height: calc(100dvh - 600px);
  justify-content: center;

  :deep(.van-empty__image) {
    width: 224px;
    height: 224px;
  }

  :deep(.van-empty__description) {
    color: #655f58;
    font-size: 28px;
  }

  &__button {
    width: 224px;
    height: 72px;
    color: #fff;
    background: var(--cart-accent);
    border: 0;
  }
}

.shop-group {
  overflow: hidden;
  margin-bottom: 0.32rem;
  background: var(--cart-paper);
  border: 0.026667rem solid rgba(45, 41, 38, 0.05);
  border-radius: 0.266667rem;
  box-shadow: 0 10px 36px rgba(63, 55, 45, 0.035);

  &__header {
    display: flex;
    height: 96px;
    padding: 0 28px;
    align-items: center;
    border-bottom: 2px solid var(--cart-line);
  }

  &__icon {
    margin-left: 20px;
    color: var(--cart-accent);
    font-size: 34px;
  }

  &__name {
    overflow: hidden;
    margin: 0 0 0 12px;
    color: var(--cart-ink);
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__count {
    margin-left: auto;
    color: #a49d97;
    font-size: 22px;
  }
}

.cart-swipe {
  &:not(:last-child)::after {
    position: absolute;
    right: 28px;
    bottom: 0;
    left: 96px;
    height: 2px;
    background: var(--cart-line);
    content: "";
  }

  &__delete {
    height: 100%;
    padding: 0 50px;
    color: #fff;
    font-size: 28px;
    background: var(--cart-accent-dark);
    border: 0;
  }
}

.cart-item {
  display: flex;
  min-height: 264px;
  padding: 28px 20px 28px 28px;
  align-items: center;
  background: var(--cart-paper);

  &__checkbox {
    flex: none;
    margin-right: 16px;
  }
}

.cart-card {
  min-width: 0;
  padding: 0;
  flex: 1;
  background: transparent;

  :deep(.van-card__header) {
    min-height: 208px;
  }

  :deep(.van-card__thumb) {
    width: 192px;
    height: 192px;
    margin-right: 22px;
    overflow: hidden;
    background: #f4f2ee;
    border-radius: 16px;
  }

  :deep(.van-card__thumb img) {
    object-fit: cover;
  }

  :deep(.van-card__content) {
    min-width: 0;
    min-height: 208px;
  }

  :deep(.van-card__title) {
    max-height: 84px;
    color: var(--cart-ink);
    font-size: 28px;
    font-weight: 600;
    line-height: 42px;
  }

  :deep(.van-card__desc) {
    display: inline-block;
    width: fit-content;
    max-width: 100%;
    margin-top: 10px;
    padding: 4px 12px;
    overflow: hidden;
    color: var(--cart-muted);
    font-size: 22px;
    line-height: 36px;
    text-overflow: ellipsis;
    white-space: nowrap;
    background: var(--cart-accent-soft);
    border-radius: 6px;
  }

  :deep(.van-card__bottom) {
    display: flex;
    flex-direction: column-reverse;
    align-items: flex-start;
    justify-content: flex-end;
  }

  :deep(.van-card__price) {
    color: var(--cart-accent);
    font-size: 34px;
    font-weight: 700;
    line-height: 40px;
  }

  :deep(.van-card__price-integer) {
    font-size: 34px;
  }

  :deep(.van-card__origin-price) {
    margin: 0 0 4px;
    color: #b0aaa3;
    font-size: 20px;
    line-height: 28px;
  }

  :deep(.van-card__footer) {
    position: absolute;
    right: 0;
    bottom: 0;
  }

  &__stepper {
    :deep(.van-stepper__minus),
    :deep(.van-stepper__plus) {
      width: 56px;
      height: 52px;
      color: #655f58;
      background: #f2f0ec;
    }

    :deep(.van-stepper__input) {
      width: 64px;
      height: 52px;
      margin: 0 4px;
      color: #3b3732;
      background: #f7f5f2;
    }
  }
}

.cart-submit {
  bottom: calc(var(--van-tabbar-height) + env(safe-area-inset-bottom));
  z-index: 10;
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 2px solid var(--cart-line);
  box-shadow: 0 -8px 36px rgba(55, 48, 39, 0.045);

  :deep(.van-submit-bar__bar) {
    height: 128px;
    padding: 0 20px 0 32px;
    background: rgba(255, 255, 255, 0.98);
  }

  :deep(.van-checkbox__label) {
    margin-left: 14px;
    color: #45413c;
    font-size: 28px;
  }

  :deep(.van-submit-bar__text) {
    color: #47423d;
    font-size: 26px;
  }

  :deep(.van-submit-bar__price) {
    color: var(--cart-accent);
    font-size: 34px;
    font-weight: 700;
  }

  :deep(.van-submit-bar__price-integer) {
    font-size: 40px;
  }

  :deep(.van-submit-bar__button) {
    width: 224px;
    height: 84px;
    margin-left: 20px;
    font-size: 30px;
    font-weight: 700;
    letter-spacing: 2px;
    border-radius: 42px;
    box-shadow: none;
  }

  &__saving {
    position: absolute;
    right: 264px;
    bottom: 10px;
    color: #a39d95;
    font-size: 18px;
  }
}
</style>
