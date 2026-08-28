<template>
  <main class="auth-page">
    <section class="auth-shell" aria-labelledby="register-title">
      <header class="page-header">
        <button type="button" aria-label="返回登录页" @click="router.back()">
          <span aria-hidden="true">‹</span> 返回
        </button>
        <strong>注册</strong>
        <i aria-hidden="true"></i>
      </header>

      <div class="auth-content">
        <header class="brand-block">
          <img
            class="brand-logo"
            src="../assets/shiguang-logo.svg"
            alt="拾光集商城"
          />
          <h1 id="register-title">创建账号</h1>
        </header>

        <van-form class="auth-form" @submit="onSubmit" ref="form">
          <van-cell-group inset>
            <van-field
              v-model="username"
              name="username"
              label="用户名"
              placeholder="用户名"
              :rules="[{ validator: userReg, message: '请填写用户名' }]"
            />
            <van-field
              v-model="password"
              type="password"
              name="password"
              label="密码"
              placeholder="密码"
              :rules="[{ validator: pwdReg, message: '请填写密码' }]"
            />
          </van-cell-group>
          <van-button
            class="submit-button"
            round
            block
            type="primary"
            native-type="submit"
          >
            注册
          </van-button>
        </van-form>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { type RegisterParams } from "../types/userInfo";
import { encrypt } from "../utils/cryptojs";
import { registerInfo } from "../api/userInfo";
import { useRouter } from "vue-router";
import { showToast } from "vant";

const username = ref("");
const password = ref("");
const router = useRouter();

const onSubmit = async () => {
  try {
    const params: RegisterParams = {
      userName: username.value,
      passWord: encrypt(password.value),
    };
    const result = await registerInfo(params);
    console.log(result, "结果");
    if (result.code == "00000") {
      showToast("注册成功，稍后跳转到登录页");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
    if (result.code == "A00001") {
      showToast(result.msg ?? "注册失败");
      username.value = "";
      password.value = "";
    }
  } catch (err) {
    console.error("注册失败");
  }
};
// 正则校验
const userReg = (val: string) => /^[\w-]{1,16}$/.test(val);
const pwdReg = (val: string) => /^(?=.*[a-z])(?=.*\d).+$/.test(val);
</script>

<style scoped lang="scss">
.auth-page {
  --accent: #d8543c;
  --accent-deep: #ad3528;
  --ink: #2f251f;
  --muted: #9b8e83;
  --line: #eadfd3;

  position: fixed;
  inset: 0;
  z-index: 10;
  overflow-y: auto;
  background:
    radial-gradient(
      circle at 86% 12%,
      rgba(232, 188, 116, 0.16),
      transparent 28%
    ),
    #f3eee6;
  color: var(--ink);
  font-family: "Songti SC", "STSong", "PingFang SC", serif;
}

.auth-shell {
  width: 100%;
  min-height: 100%;
  margin: 0 auto;
  overflow: hidden;
  background:
    linear-gradient(rgba(255, 253, 248, 0.96), rgba(255, 253, 248, 0.96)),
    repeating-linear-gradient(
      0deg,
      transparent 0 0.28rem,
      rgba(91, 67, 45, 0.03) 0.3rem
    );
}

.page-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  height: 1.28rem;
  padding: 0 0.55rem;
  border-bottom: 0.02rem solid var(--line);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;

  button {
    justify-self: start;
    min-height: 0.82rem;
    padding: 0 0.16rem 0 0;
    border: 0;
    color: var(--accent-deep);
    background: transparent;
    font: inherit;
    font-size: 0.36rem;
    cursor: pointer;
  }

  button span {
    display: inline-block;
    margin-right: 0.04rem;
    font-size: 0.6rem;
    font-weight: 300;
    line-height: 0;
    vertical-align: -0.03rem;
  }

  strong {
    font-size: 0.4rem;
    font-weight: 700;
    letter-spacing: 0.04rem;
  }
}

.auth-content {
  width: 8.35rem;
  margin: 0 auto;
  padding: 2.45rem 0 1rem;
}

.brand-block {
  text-align: center;
  animation: reveal 0.55s ease-out both;

  h1 {
    margin: 0.3rem 0 0;
    font-size: 0.62rem;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.06rem;
  }

  p {
    margin: 0.14rem 0 0;
    color: var(--muted);
    font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
    font-size: 0.29rem;
    letter-spacing: 0.04rem;
  }
}

.brand-logo {
  display: block;
  width: 1.82rem;
  height: 1.82rem;
  margin: 0 auto;
}

.auth-form {
  margin-top: 0.52rem;
  animation: reveal 0.55s 0.08s ease-out both;
}

:deep(.van-cell-group--inset) {
  margin: 0;
  overflow: visible;
  background: transparent;
  border-radius: 0;
}

:deep(.van-cell) {
  min-height: 1.22rem;
  padding: 0.28rem 0.08rem;
  color: var(--ink);
  background: transparent;
  border-bottom: 0.02rem solid var(--line);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

:deep(.van-cell::after) {
  display: none;
}

:deep(.van-field__label) {
  width: 2.35rem;
  margin-right: 0.25rem;
  color: var(--ink);
  font-size: 0.38rem;
}

:deep(.van-field__control) {
  color: var(--ink);
  font-size: 0.38rem;
  caret-color: var(--accent);
}

:deep(.van-field__control::placeholder) {
  color: #c6bbb1;
}

:deep(.van-field__error-message) {
  color: var(--accent-deep);
  font-size: 0.28rem;
}

:deep(.submit-button.van-button) {
  height: 1.18rem;
  margin-top: 0.95rem;
  border: 0;
  background: linear-gradient(135deg, #e76648, var(--accent-deep));
  box-shadow: 0 0.2rem 0.46rem rgba(173, 53, 40, 0.2);
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 0.4rem;
  font-weight: 600;
  letter-spacing: 0.08rem;
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(0.18rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-block,
  .auth-form {
    animation: none;
  }
}
</style>
