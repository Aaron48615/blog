<template>
  <div class="address-page" :aria-busy="isInitialLoading">
    <div
      class="addr-list"
      :class="{ 'addr-list--batch': isBatchDeleteMode }"
      v-if="isListShow == true"
    >
      <van-nav-bar
        title="地址列表"
        left-text="返回"
        :right-text="isBatchDeleteMode ? '退出批量删除' : '批量删除'"
        left-arrow
        @click-left="onClickLeft"
        @click-right="onClickRight"
        :right-disabled="delDisabled || isInitialLoading"
        fixed
      />

      <!-- 地址列表加载前显示简化卡片骨架 -->
      <div v-if="isInitialLoading" class="address-skeleton">
        <van-skeleton
          v-for="item in 3"
          :key="item"
          class="address-skeleton__card"
          title
          :row="2"
          avatar
          avatar-shape="square"
          animate
        />
      </div>

      <van-address-list
        v-else
        class="address-list"
        v-model="addressListModel"
        :list="list"
        :disabled-list="disabledFakeList"
        :add-button-text="isBatchDeleteMode ? '删除' : '新增地址'"
        disabled-text="以下地址超出配送范围"
        default-tag-text="默认"
        @add="handleBottomButtonClick"
        @edit="onEdit"
        @select="handleSelect"
      >
      </van-address-list>
    </div>
    <!-- 新增 -->
    <div class="addr-add" v-if="isListShow == false && isAddShow == true" fixed>
      <van-nav-bar
        title="新增地址"
        left-text="返回"
        left-arrow
        @click-left="handleBack"
      />
      <van-address-edit
        :area-list="areaList"
        show-set-default
        :search-result="searchResult"
        :area-columns-placeholder="['请选择', '请选择', '请选择']"
        @save="onSave"
      />
    </div>
    <!-- 编辑 -->
    <div
      class="addr-edit"
      v-if="isListShow == false && isAddShow == false"
      fixed
    >
      <van-nav-bar
        title="编辑地址"
        left-text="返回"
        left-arrow
        @click-left="handleBack"
      />
      <van-address-edit
        :area-list="areaList"
        show-delete
        show-set-default
        :search-result="searchResult"
        :area-columns-placeholder="['请选择', '请选择', '请选择']"
        @save="handleEdit"
        :address-info="editAddress"
        @delete="onDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  addrInfo,
  addrListInfo,
  defaultAddrInfo,
  areaInfo,
  addAddrInfo,
  deleteAddrInfo,
  updateAddrInfo,
} from "../api/address";
import type { AddressEditInfo } from "vant";
import { showConfirmDialog, showToast } from "vant";
import "vant/es/dialog/style";
import { areaList } from "@vant/area-data";
import { useRoute, useRouter } from "vue-router";

interface AreaItem {
  areaId: number;
  areaName: string;
}

interface AddressApiItem {
  addrId: number;
  receiver: string;
  mobile: string;
  province: string;
  city: string;
  area: string;
  addr: string;
  commonAddr: number;
}

interface AddressListItem {
  id: number;
  name: string;
  tel: string;
  address: string;
  isDefault: boolean;
}

const chosenAddressId = ref<string | number>("1");
const disabledFakeList = [
  {
    id: "3",
    name: "王五",
    tel: "1320000000",
    address: "浙江省杭州市滨江区江南大道 15 号",
  },
];
const list = ref<AddressListItem[]>([]);
const isInitialLoading = ref(true);
const isListShow = ref(true);
const isAddShow = ref(false);
// 当前正在编辑/删除的单个地址id
const editingAddressId = ref<number | null>(null);
// 要编辑的地址的信息
const editAddress = ref({});
// 批量删除模式下选中的地址
const selectedAddressIds = ref<number[]>([]);
// 当前是否处于批量删除模式
const isBatchDeleteMode = ref(false);
// 根据当前模式为地址列表提供单选值或多选数组
const addressListModel = computed<string | number | Array<string | number>>({
  get: () =>
    isBatchDeleteMode.value ? selectedAddressIds.value : chosenAddressId.value,
  set: (value) => {
    if (isBatchDeleteMode.value) {
      selectedAddressIds.value = value as number[];
    } else {
      chosenAddressId.value = value as string | number;
    }
  },
});
// 批量删除按钮是否禁用
const delDisabled = ref(false);
const route = useRoute();
const router = useRouter();
const isOrderSelectMode = computed(() => route.query.mode === "order");

onMounted(() => {
  init();
});

const init = async () => {
  isInitialLoading.value = true;
  try {
    const { data: responseData } = await addrListInfo();
    const data = responseData as AddressApiItem[];
    list.value = data.map(addressItem);

    if (isOrderSelectMode.value) {
      const confirmMessage = sessionStorage.getItem("confirm");
      const confirmData = confirmMessage ? JSON.parse(confirmMessage) : {};
      const currentAddress =
        data.find((item) => item.addrId === Number(confirmData.addrId)) ||
        data.find((item) => item.commonAddr === 1) ||
        data[0];

      if (currentAddress) {
        chosenAddressId.value = currentAddress.addrId;
      }
    }
    console.log(list.value);
  } catch (err) {
    list.value = [];
    console.error("地址列表加载失败：", err);
    showToast("地址列表加载失败，请稍后重试");
  } finally {
    isInitialLoading.value = false;
  }
};

const onClickLeft = () => history.back();
// 对直辖市city字段做处理，防止不能添加直辖市为地区。普通省不变
const getBackendCityName = (province: string, city: string) => {
  return province === city ? "市辖区" : city;
};
// 打开新增地址
const onAdd = () => {
  isListShow.value = false;
  isAddShow.value = true;
};
// 保存新增的地址
const onSave = async (val: AddressEditInfo) => {
  const res1 = await areaInfo({ pid: 0 });
  const province = res1.data.find((item: AreaItem) => {
    return item.areaName == val.province;
  });
  const res2 = await areaInfo({ pid: province.areaId });
  const cityName = getBackendCityName(val.province, val.city);
  const city = res2.data.find((item: AreaItem) => {
    return item.areaName == cityName;
  });
  if (!city) {
    showToast("城市数据匹配失败");
    return;
  }
  const res3 = await areaInfo({ pid: city.areaId });
  const county = res3.data.find((item: AreaItem) => {
    return item.areaName == val.county;
  });
  // 设置默认地址：新增的时候没有addrId，所以添加地址之前先请求一下已有地址的所有addrId
  const beforeResult = await addrListInfo();
  const oldIds = new Set(
    beforeResult.data.map((item: AddressApiItem) => item.addrId),
  );
  // 添加
  let { data } = await addAddrInfo({
    addr: val.addressDetail,
    area: val.county,
    areaId: county.areaId,
    city: val.city,
    cityId: city.areaId,
    commonAddr: val.isDefault ? 1 : 0,
    mobile: val.tel,
    province: val.province,
    provinceId: province.areaId,
    receiver: val.name,
  });
  // 如果勾选了设置为默认地址，则再请求一遍所有的addrId，和之前的做对比，找到新的addrId
  if (val.isDefault) {
    const afterResult = await addrListInfo();
    const newAddress = afterResult.data.find(
      (item: AddressApiItem) => !oldIds.has(item.addrId),
    );
    // 找到新的地址的addrId了，再执行设置默认地址的方法
    if (newAddress) {
      await defaultAddrInfo(newAddress.addrId);
    }
  }
  showToast(data);
  handleBack();
};
// 打开编辑地址页面并对要编辑的地址做处理
const onEdit = async (val: AddressListItem) => {
  console.log(val);
  const { data } = await addrInfo(val.id);
  console.log(data);
  editingAddressId.value = data.addrId;
  editAddress.value = {
    name: data.receiver,
    tel: data.mobile,
    province: data.province,
    city: data.city,
    county: data.area,
    addressDetail: data.addr,
    isDefault: data.commonAddr === 1,
  };
  isListShow.value = false;
  isAddShow.value = false;
};
// 保存编辑后地址
const handleEdit = async (val: AddressEditInfo) => {
  // console.log('编辑地址 areaCode：', val.areaCode)
  const res1 = await areaInfo({ pid: 0 });
  const province = res1.data.find((item: AreaItem) => {
    return item.areaName == val.province;
  });
  const res2 = await areaInfo({ pid: province.areaId });
  // const city = res2.data.find((item: AreaItem) => {
  //   return item.areaName == val.city
  // })
  const cityName = getBackendCityName(val.province, val.city);
  const city = res2.data.find((item: AreaItem) => {
    return item.areaName == cityName;
  });
  if (!city) {
    showToast("城市数据匹配失败");
    return;
  }
  const res3 = await areaInfo({ pid: city.areaId });
  const county = res3.data.find((item: AreaItem) => {
    return item.areaName == val.county;
  });
  const { data } = await updateAddrInfo({
    addr: val.addressDetail,
    addrId: editingAddressId.value,
    area: val.county,
    areaId: county.areaId,
    city: val.city,
    cityId: city.areaId,
    // commonAddr: val.isDefault ? 1 : 0,
    mobile: val.tel,
    province: val.province,
    provinceId: province.areaId,
    receiver: val.name,
  });
  // 设置默认地址
  if (val.isDefault && editingAddressId.value !== null) {
    await defaultAddrInfo(editingAddressId.value);
  }
  showToast(data || "修改成功");
  handleBack();
};
// 删除单个地址
const onDelete = async () => {
  if (editingAddressId.value === null) return;
  const { data } = await deleteAddrInfo(editingAddressId.value);
  // console.log(data);
  showToast(data);
  handleBack();
};
// 进入或退出批量删除模式，并清空上一次的多选结果
const onClickRight = () => {
  isBatchDeleteMode.value = !isBatchDeleteMode.value;
  selectedAddressIds.value = [];
};
// 删除批量模式下选中的所有地址
const onBatchDelete = async () => {
  if (!selectedAddressIds.value.length) {
    showToast("请先选择要删除的地址");
    return;
  }

  try {
    await showConfirmDialog({
      title: "批量删除",
      message: `确定删除选中的 ${selectedAddressIds.value.length} 个地址吗？`,
    });
  } catch {
    return;
  }

  await Promise.all(selectedAddressIds.value.map((id) => deleteAddrInfo(id)));

  selectedAddressIds.value = [];
  isBatchDeleteMode.value = false;
  await init();
  showToast("批量删除成功");
};
// 根据当前模式处理底部的新增地址或删除按钮
const handleBottomButtonClick = async () => {
  if (isBatchDeleteMode.value) {
    await onBatchDelete();
    return;
  }

  onAdd();
};
//
const handleDefault = async (val: AddressApiItem) => {
  const { data } = await defaultAddrInfo(val.addrId);
  showToast({
    type: "success",
    message: "修改默认地址成功",
  });
  init();
};
//
const handleSelect = (val: AddressListItem) => {
  if (!isOrderSelectMode.value || isBatchDeleteMode.value) return;

  const confirmMessage = sessionStorage.getItem("confirm");
  if (!confirmMessage) {
    showToast("订单信息已失效，请重新结算");
    return;
  }

  const confirmData = JSON.parse(confirmMessage);
  confirmData.addrId = Number(val.id);
  sessionStorage.setItem("confirm", JSON.stringify(confirmData));
  router.back();
};
//
const handleBack = () => {
  isListShow.value = true;
  init();
};
// 返回标准地址列表格式
function addressItem(val: AddressApiItem): AddressListItem {
  // console.log('val', val);
  return {
    id: val.addrId,
    name: val.receiver,
    tel: val.mobile,
    address: val.province + val.city + val.area + val.addr,
    isDefault: val.commonAddr == 1 ? true : false,
  };
}

// 详细地址字段
const searchResult = ref([]);
</script>

<style scoped lang="scss">
.address-page {
  --shop-primary: #c9432e;
  --shop-primary-dark: #ad3524;
  --shop-primary-light: #fff0eb;
  --shop-page-bg: #f7f5f2;
  --shop-surface: #fff;
  --shop-text: #2d2926;
  --shop-text-secondary: #716b66;
  --shop-text-muted: #a49d97;
  --shop-border: #e9e3dd;
  --shop-danger: #d9363e;

  --van-primary-color: var(--shop-primary);
  --van-danger-color: var(--shop-primary);
  --van-text-color: var(--shop-text);
  --van-text-color-2: var(--shop-text-secondary);
  --van-text-color-3: var(--shop-text-muted);
  --van-border-color: var(--shop-border);
  --van-address-list-radio-color: var(--shop-primary);
  --van-switch-on-background: var(--shop-primary);
  --van-button-danger-background: var(--shop-primary);
  --van-button-danger-border-color: var(--shop-primary);
  --van-button-primary-background: var(--shop-primary);
  --van-button-primary-border-color: var(--shop-primary);

  min-height: 100vh;
  color: var(--shop-text);
  background: var(--shop-page-bg);
}

.addr-list,
.addr-add,
.addr-edit {
  min-height: 100vh;
  background: var(--shop-page-bg);
}

.address-page :deep(.van-nav-bar) {
  background: rgba(255, 255, 255, 0.98);
}

.address-page :deep(.van-nav-bar::after) {
  border-color: var(--shop-border);
}

.address-page :deep(.van-nav-bar__title) {
  color: var(--shop-text);
  font-weight: 600;
}

.address-page :deep(.van-nav-bar__text),
.address-page :deep(.van-nav-bar .van-icon) {
  color: var(--shop-primary);
}

.address-skeleton {
  padding: 1.546667rem 0.32rem 0.32rem;
  background: var(--shop-page-bg);
}

.address-skeleton__card {
  padding: 0.4rem;
  margin-bottom: 0.266667rem;
  background: var(--shop-surface);
  border-radius: 0.266667rem;
  --van-skeleton-avatar-size: 1.6rem;
  --van-skeleton-paragraph-height: 0.32rem;
}

.address-list {
  --van-address-list-padding: 0.32rem 0.32rem
    calc(2.4rem + env(safe-area-inset-bottom));
  --van-address-list-disabled-text-color: var(--shop-primary-dark);
  --van-address-list-item-text-color: var(--shop-text-secondary);

  margin-top: 1.226667rem;
  background: var(--shop-page-bg);
}

.address-list :deep(.van-address-item) {
  margin-bottom: 0.266667rem;
  overflow: hidden;
  background: var(--shop-surface);
  border: 0.026667rem solid rgba(45, 41, 38, 0.04);
  border-radius: 0.266667rem;
  box-shadow: 0 0.08rem 0.266667rem rgba(45, 41, 38, 0.04);
}

.address-list :deep(.van-address-item__name) {
  color: var(--shop-text);
  font-weight: 600;
}

.address-list :deep(.van-address-item__address) {
  color: var(--shop-text-secondary);
}

.address-list :deep(.van-address-item__edit) {
  color: var(--shop-text-muted);
}

.address-list :deep(.van-tag--primary),
.address-list :deep(.van-tag--danger) {
  color: var(--shop-primary);
  background: var(--shop-primary-light);
  border-color: #efc8bd;
}

.address-list :deep(.van-address-item--disabled) {
  background: var(--shop-page-bg);
  border-color: #efd8cf;
  border-radius: 0.266667rem;
  box-shadow: none;
  opacity: 1;
}

.address-list :deep(.van-address-item--disabled .van-cell) {
  background: transparent;
}

.address-list :deep(.van-address-item--disabled .van-address-item__name) {
  color: var(--shop-text-secondary);
}

.address-list :deep(.van-address-item--disabled .van-address-item__address) {
  color: var(--shop-text-muted);
}

.address-list :deep(.van-address-item--disabled .van-address-item__edit) {
  color: #b7aaa4;
}

.address-list :deep(.van-address-item--disabled .van-radio__icon .van-icon) {
  color: #d7c8be;
  background: #f6f1ed;
  border-color: #d7c8be;
}

.address-list :deep(.van-address-list__disabled-text) {
  color: var(--shop-primary-dark);
}

.address-list :deep(.van-address-list__bottom) {
  padding: 0.266667rem 0.32rem calc(0.266667rem + env(safe-area-inset-bottom));
  background: rgba(247, 245, 242, 0.96);
}

.address-list :deep(.van-address-list__add) {
  height: 1.173333rem;
  background: var(--shop-primary);
  border-color: var(--shop-primary);
  border-radius: 0.586667rem;
}

.addr-list :deep(.van-nav-bar__right .van-nav-bar__text) {
  color: var(--shop-primary);
}

.addr-list--batch :deep(.van-address-item__edit) {
  display: none;
}

.addr-list--batch :deep(.van-address-list__add) {
  background: var(--shop-danger);
  border-color: var(--shop-danger);
}

.addr-add :deep(.van-address-edit),
.addr-edit :deep(.van-address-edit) {
  padding: 0.32rem;
}

.addr-add :deep(.van-cell-group),
.addr-edit :deep(.van-cell-group) {
  overflow: hidden;
  background: var(--shop-surface);
  border-radius: 0.266667rem;
}

.addr-add :deep(.van-cell),
.addr-edit :deep(.van-cell) {
  color: var(--shop-text);
  background: var(--shop-surface);
}

.addr-add :deep(.van-address-edit__buttons),
.addr-edit :deep(.van-address-edit__buttons) {
  padding: 0.426667rem 0 0;
}

.addr-add :deep(.van-address-edit__buttons .van-button),
.addr-edit :deep(.van-address-edit__buttons .van-button) {
  height: 1.173333rem;
  border-radius: 0.586667rem;
}

.addr-edit :deep(.van-address-edit__buttons .van-button--default) {
  color: var(--shop-danger);
  background: var(--shop-surface);
  border-color: var(--shop-danger);
}
</style>
