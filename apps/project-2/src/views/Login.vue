<template>
  <main class="auth-page">
    <section class="auth-shell" aria-labelledby="login-title">
      <div class="auth-content">
        <header class="brand-block">
          <img
            class="brand-logo"
            src="../assets/shiguang-logo.svg"
            alt="拾光集商城"
          />
          <h1 id="login-title">拾光集</h1>
        </header>

        <van-form class="auth-form" @submit="onSubmit">
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
            登录
          </van-button>
        </van-form>

        <button class="goRegister" type="button" @click="goRegister">
          还没有账号？<span>去注册</span>
        </button>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { loginInfo } from "../api/userInfo";
import { useRouter } from "vue-router";
import { type LoginParams } from "../types/userInfo";
import { encrypt } from "../utils/cryptojs";
import { setToken } from "../utils/auth";
import { showToast } from "vant";

const username = ref("");
const password = ref("");
// const onSubmit = (values: LoginParams) => {
//   console.log('submit', values);
//   let {username, password} = values;
//   loginInfo({
//     userName: username,
//     passWord: password
//   }).then((res: any) => {
//     console.log(res);
//   }).catch((err: any) => {
//     throw new Error(err);
//   })
// };
const onSubmit = async () => {
  try {
    const params: LoginParams = {
      userName: username.value,
      passWord: encrypt(password.value),
    };
    const result = await loginInfo(params);
    console.log(result, "结果");
    if (result.code == "00000") {
      setToken(result.data.accessToken);
      showToast("登录成功");
      router.push("/home");
    }
  } catch (err) {
    console.error("登录失败");
  }
};
const router = useRouter();
const goRegister = () => {
  router.push("/register");
};

// 正则校验
const userReg = (val: string) => /^[\w-]{1,16}$/.test(val);
const pwdReg = (val: string) =>
  /^(?![a-zA-Z]+$)(?![A-Z0-9]+$)(?![A-Z\W_!@#$%^&*`~()-+=]+$)(?![a-z0-9]+$)(?![a-z\W_!@#$%^&*`~()-+=]+$)(?![0-9\W_!@#$%^&*`~()-+=]+$)[a-zA-Z0-9\W_!@#$%^&*`~()-+=]/.test(
    val,
  );
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
      circle at 14% 10%,
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

.auth-content {
  width: 8.35rem;
  margin: 0 auto;
  padding: 2.65rem 0 1rem;
}

.brand-block {
  text-align: center;
  animation: reveal 0.55s ease-out both;

  h1 {
    margin: 0.3rem 0 0;
    font-size: 0.7rem;
    font-weight: 700;
    line-height: 1.3;
    letter-spacing: 0.12rem;
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
  margin-top: 0.62rem;
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

.goRegister {
  display: block;
  margin: 0.54rem auto 0;
  padding: 0.2rem;
  border: 0;
  color: var(--muted);
  background: transparent;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  font-size: 0.35rem;
  cursor: pointer;
  animation: reveal 0.55s 0.16s ease-out both;

  span {
    color: var(--accent-deep);
    font-weight: 600;
  }
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

@media (min-width: 768px) {
  .auth-page {
    padding: 0.45rem 0;
  }

  .auth-shell {
    width: 5.2rem;
    min-height: calc(100vh - 0.9rem);
    border: 0.02rem solid rgba(93, 69, 48, 0.12);
    box-shadow: 0 0.28rem 0.8rem rgba(79, 58, 41, 0.1);
  }

  .auth-content {
    width: 4.35rem;
    padding-top: 1.15rem;
  }

  .brand-logo {
    width: 1.08rem;
    height: 1.08rem;
  }

  .brand-block h1 {
    margin-top: 0.18rem;
    font-size: 0.42rem;
  }

  .brand-block p {
    font-size: 0.2rem;
  }

  .auth-form {
    margin-top: 0.36rem;
  }

  :deep(.van-cell) {
    min-height: 0.74rem;
    padding: 0.16rem 0.04rem;
  }

  :deep(.van-field__label) {
    width: 1.35rem;
    font-size: 0.23rem;
  }

  :deep(.van-field__control) {
    font-size: 0.23rem;
  }

  :deep(.submit-button.van-button) {
    height: 0.7rem;
    margin-top: 0.55rem;
    font-size: 0.24rem;
  }

  .goRegister {
    margin-top: 0.3rem;
    font-size: 0.22rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-block,
  .auth-form,
  .goRegister {
    animation: none;
  }
}
</style>
