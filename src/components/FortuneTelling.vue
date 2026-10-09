<template>
  <div class="relative inline-flex items-center select-none font-sans">
    <!-- 顶部导航栏内精致精工铜钱挂件 (古韵灵运挂坠 · 迎风物理轻摆；水面接近时落入水中) -->
    <div
      ref="coinCharmRef"
      class="relative flex flex-col items-center cursor-pointer group px-1.5 select-none origin-top will-change-transform transition-opacity duration-500"
      :class="isSubmerged ? 'opacity-0 pointer-events-none' : 'opacity-100'"
      :style="coinWindStyle"
      @click="toggleModal"
      title="文王六爻 · 铜钱起卦"
    >
      <!-- 挂环系扣 -->
      <div class="w-1.5 h-1.5 rounded-full bg-red-600/90 shadow-sm border border-red-400/40"></div>

      <!-- 短红绳编织线 (优雅悬挂在导航栏内，不侵入下层内容) -->
      <div
        class="w-[2px] h-3 bg-gradient-to-b from-red-600 via-rose-500 to-red-600 transition-all duration-300"
        :class="isPulling ? 'h-4' : 'group-hover:h-3.5'"
      ></div>

      <!-- 核心精致小铜钱 (外圆内方，光泽流转，悬摆动效) -->
      <div
        class="coin-charm relative w-6 h-6 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 p-[1.2px] shadow-md flex items-center justify-center transition-all duration-300 group-hover:scale-110 active:scale-95"
        :class="{ 'translate-y-1': isPulling }"
      >
        <div class="w-full h-full rounded-full bg-gradient-to-br from-amber-800 via-amber-600 to-yellow-900 flex items-center justify-center relative overflow-hidden">
          <!-- 铜钱微小方孔 -->
          <div class="w-1.5 h-1.5 border border-amber-300/80 bg-slate-950 rounded-[0.5px] flex items-center justify-center shadow-inner">
            <span class="w-0.5 h-0.5 bg-amber-400 rounded-full animate-ping"></span>
          </div>
          <!-- 四角微雕铭文字样 -->
          <span class="absolute top-[1px] text-[5px] font-black text-amber-200 leading-none scale-75">乾</span>
          <span class="absolute bottom-[1px] text-[5px] font-black text-amber-200 leading-none scale-75">坤</span>
          <span class="absolute left-[1px] text-[5px] font-black text-amber-200 leading-none scale-75">通</span>
          <span class="absolute right-[1px] text-[5px] font-black text-amber-200 leading-none scale-75">宝</span>

          <!-- 扫光光效 -->
          <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"></div>
        </div>
      </div>

      <!-- 下垂小流苏束与金珠 (随风摆动) -->
      <div class="w-[1.5px] h-1.5 bg-red-600"></div>
      <div class="w-1 h-1 rounded-full bg-amber-400 shadow-sm"></div>
      <div
        class="w-0.5 h-2 bg-gradient-to-b from-red-600 to-rose-700 rounded-b-full origin-top will-change-transform"
        :style="{ transform: `rotate(${coinSwayAngle * 1.1}deg)` }"
      ></div>

      <!-- 悬浮微提示气泡 -->
      <div class="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-amber-300 text-[11px] px-2.5 py-1 rounded-lg border border-amber-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-xl flex items-center gap-1.5 scale-95 group-hover:scale-100">
        <span>🪙</span>
        <span class="font-medium">文王六爻 · 铜钱起卦</span>
      </div>
    </div>

    <!-- 铜钱占卜法坛全屏弹窗 (东方金石典雅古韵 · 零AI塑料感) -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="isOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto"
          @click.self="closeModal"
        >
          <!-- 核心神台卡片：桌面端左右并排，移动端自适应上下堆叠并可滑动 -->
          <div
            class="relative bg-[#111114] border border-[#332b21] rounded-2xl p-3 sm:p-5 text-[#dfd7c8] shadow-2xl flex flex-col font-serif select-none w-full max-w-[920px] max-h-[92vh] overflow-y-auto custom-scrollbar my-auto"
            style="box-shadow: 0 25px 60px -15px rgba(0,0,0,0.95), 0 0 0 1px rgba(197, 160, 89, 0.12);"
            @click.stop
          >
            <!-- 顶部雅致标题栏 -->
            <div class="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[#29241c] shrink-0">
              <!-- 左侧：典籍题铭 -->
              <div class="flex items-baseline gap-2 sm:gap-3">
                <span class="text-base sm:text-lg font-bold tracking-widest text-[#dfbc74]">周易文王课</span>
                <span class="text-[10px] sm:text-xs text-[#8e8576] tracking-wider hidden xs:inline">《火珠林》法 · 三钱成象</span>
              </div>

              <!-- 右侧：卦谱/断语视图切换 + 音效 + 关闭 -->
              <div class="flex items-center gap-1.5 sm:gap-2">
                <!-- 已满六爻时提供【断卦签辞 / 六爻图谱】切换 -->
                <div v-if="todayResult" class="flex items-center rounded-lg bg-[#18181d] border border-[#332b21] p-0.5 text-xs mr-1 sm:mr-2">
                  <button
                    type="button"
                    @click="rightTab = 'reading'"
                    class="px-2 sm:px-2.5 py-1 rounded font-medium transition-all cursor-pointer text-[11px] sm:text-xs"
                    :class="rightTab === 'reading' ? 'bg-[#c5a059] text-[#111114] font-bold shadow-sm' : 'text-[#8e8576] hover:text-[#dfbc74]'"
                  >
                    断卦签辞
                  </button>
                  <button
                    type="button"
                    @click="rightTab = 'yao'"
                    class="px-2 sm:px-2.5 py-1 rounded font-medium transition-all cursor-pointer text-[11px] sm:text-xs"
                    :class="rightTab === 'yao' ? 'bg-[#c5a059] text-[#111114] font-bold shadow-sm' : 'text-[#8e8576] hover:text-[#dfbc74]'"
                  >
                    六爻图谱
                  </button>
                </div>

                <!-- 静音切换 -->
                <button
                  type="button"
                  @click="toggleMute"
                  class="p-1 sm:p-1.5 rounded-lg text-[#8e8576] hover:text-[#dfbc74] hover:bg-[#1a1a20] transition-colors cursor-pointer"
                  :title="isMuted ? '开启落币音效' : '静音'"
                >
                  <svg v-if="!isMuted" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                  <svg v-else class="w-4 h-4 text-[#5e584f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                </button>

                <!-- 关闭 -->
                <button
                  type="button"
                  class="p-1 sm:p-1.5 rounded-lg text-[#8e8576] hover:text-[#dfd7c8] hover:bg-[#1a1a20] transition-colors cursor-pointer"
                  @click="closeModal"
                  title="收起法盘"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- 主演易区：桌面端左右两列 (450px + 390px)，移动端单列上下排列 (自适应宽度) -->
            <div class="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-3 sm:gap-5 mt-3 sm:mt-4">
              <!-- 左侧：3D 铜钱法盘视口 (移动端自适应屏幕宽度，桌面端最大 450px) -->
              <div
                class="w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[420px] lg:w-[450px] aspect-square shrink-0 relative rounded-xl overflow-hidden bg-[#0a0a0c] border border-[#2a251e] cursor-pointer group shadow-inner mx-auto"
                @click="handleTossNext"
                title="点击法盘掷钱起爻"
              >
                <canvas ref="canvas3dRef" class="w-full h-full block"></canvas>

                <!-- 盘底典雅古风提示 -->
                <div class="absolute bottom-3.5 inset-x-0 flex items-center justify-center pointer-events-none">
                  <div
                    v-if="!isTossing && yaos.length < 6"
                    class="px-3.5 py-1 rounded-full bg-[#111114]/90 border border-[#383126] text-[11px] text-[#c5a059] tracking-widest shadow-md"
                  >
                    轻触法盘 · 掷币起爻
                  </div>
                  <div
                    v-else-if="isTossing"
                    class="px-3.5 py-1 rounded-full bg-[#111114]/90 border border-[#6b2a2a] text-[11px] text-[#e0a8a8] tracking-wider shadow-md flex items-center gap-1.5"
                  >
                    <span>铜钱翻腾 · 正在立爻…</span>
                  </div>
                  <div
                    v-else-if="yaos.length === 6"
                    class="px-3.5 py-1 rounded-full bg-[#111114]/90 border border-[#2d4d2d] text-[11px] text-[#a4c5a4] tracking-widest shadow-md"
                  >
                    六爻既备 · 卦象大成
                  </div>
                </div>
              </div>

              <!-- 右侧：桌面端 390px 宽 * 450px 高，移动端 w-full min-h-[380px] 信息台 -->
              <div class="w-full max-w-[340px] xs:max-w-[380px] sm:max-w-[420px] lg:w-[390px] min-h-[420px] lg:h-[450px] shrink-0 flex flex-col justify-between bg-[#15151a]/60 border border-[#2a251e] rounded-xl p-3 sm:p-4 mx-auto">
                <!-- 场景 A：起爻阶段 或 手动查看六爻卦谱 -->
                <template v-if="yaos.length < 6 || rightTab === 'yao'">
                  <!-- 顶栏状态 -->
                  <div class="flex items-center justify-between text-xs text-[#a09583] border-b border-[#29241c] pb-2 font-mono">
                    <span>六爻卦画（自初至上）</span>
                    <span class="text-[#c5a059] font-serif">进境：{{ yaos.length }} / 6 爻</span>
                  </div>

                  <!-- 六爻容器：从上到下排布 上爻(5) -> 初爻(0) -->
                  <div class="flex flex-col-reverse justify-around h-[320px] py-2">
                    <div
                      v-for="(yName, index) in YAO_NAMES"
                      :key="index"
                      class="flex items-center gap-2 text-xs transition-all duration-300 px-2 py-1.5 rounded"
                      :class="yaos[index] ? 'bg-[#18181f]/80' : (yaos.length === index ? 'bg-[#241f17] border border-[#524328]' : 'opacity-35')"
                    >
                      <!-- 爻位名 -->
                      <span class="w-8 text-[11px] text-[#a09583] font-serif shrink-0">
                        {{ yName }}
                      </span>

                      <!-- 爻形展示 -->
                      <div class="flex-1 flex items-center justify-center h-4 relative">
                        <template v-if="yaos[index]">
                          <!-- 阳爻 (实线) -->
                          <div
                            v-if="yaos[index].isYang"
                            class="w-full h-2.5 rounded-sm bg-[#c5a059] shadow-sm relative flex items-center justify-center"
                          >
                            <span v-if="yaos[index].isChanging" class="absolute -right-5 text-[#b83b3b] font-bold text-xs" title="老阳动爻">○</span>
                          </div>
                          <!-- 阴爻 (双断线) -->
                          <div
                            v-else
                            class="w-full h-2.5 flex justify-between relative items-center"
                          >
                            <div class="w-[44%] h-full rounded-sm bg-[#546274]"></div>
                            <div class="w-[44%] h-full rounded-sm bg-[#546274]"></div>
                            <span v-if="yaos[index].isChanging" class="absolute -right-5 text-[#b83b3b] font-bold text-xs" title="老阴动爻">✕</span>
                          </div>
                        </template>
                        <template v-else>
                          <div class="w-full h-0.5 border-b border-dashed border-[#3a352c]"></div>
                        </template>
                      </div>

                      <!-- 爻象属性 -->
                      <span class="w-16 text-[10px] text-right font-serif shrink-0" :class="yaos[index] ? (yaos[index].isChanging ? 'text-[#c5a059] font-bold' : 'text-[#c8bfae]') : 'text-[#5c5549]'">
                        {{ yaos[index] ? yaos[index].name : '待筮' }}
                      </span>
                    </div>
                  </div>

                  <!-- 卦体内外说明与操作控制 -->
                  <div>
                    <div class="flex items-center justify-between text-[10px] text-[#787062] pb-2 border-b border-[#242018]">
                      <span>内卦（初/二/三爻）</span>
                      <span>外卦（四/五/上爻）</span>
                    </div>

                    <div class="mt-2.5 flex items-center gap-2">
                      <!-- 手动掷爻 -->
                      <button
                        v-if="yaos.length < 6"
                        type="button"
                        @click="handleTossNext"
                        :disabled="isTossing"
                        class="flex-1 py-2 px-3 rounded-lg font-serif text-xs bg-[#7a5c24] hover:bg-[#8f6d2b] text-[#fdf8ee] transition-all active:scale-95 disabled:opacity-40 cursor-pointer shadow-sm tracking-wider"
                      >
                        {{ isTossing ? `正在掷【${YAO_NAMES[yaos.length]}】…` : `起第 ${yaos.length + 1} 爻（${YAO_NAMES[yaos.length]}）` }}
                      </button>

                      <!-- 顺次毕卦 -->
                      <button
                        v-if="yaos.length < 6"
                        type="button"
                        @click="tossAllSix"
                        :disabled="isTossing"
                        class="py-2 px-3 rounded-lg font-serif text-xs bg-[#1a1a20] hover:bg-[#23232c] text-[#c5a059] border border-[#383126] transition-all active:scale-95 disabled:opacity-40 cursor-pointer tracking-wider"
                      >
                        顺次毕卦
                      </button>

                      <!-- 已满六爻时转至解卦 -->
                      <button
                        v-else
                        type="button"
                        @click="rightTab = 'reading'"
                        class="flex-1 py-2 px-3 rounded-lg font-serif text-xs bg-[#7a5c24] hover:bg-[#8f6d2b] text-[#fdf8ee] transition-all active:scale-95 cursor-pointer tracking-wider text-center"
                      >
                        六爻齐备 · 查看卦辞详析
                      </button>

                      <button
                        v-if="yaos.length === 6"
                        type="button"
                        @click="resetDivination"
                        class="py-2 px-3 rounded-lg font-serif text-xs bg-[#1a1a20] hover:bg-[#23232c] text-[#c5a059] border border-[#383126] transition-all active:scale-95 cursor-pointer"
                      >
                        再筮
                      </button>
                    </div>
                  </div>
                </template>

                <!-- 场景 B：六爻大成，呈现典籍解卦详析 (无滚动条，端严雅正) -->
                <template v-else-if="todayResult">
                  <!-- 1. 本卦与变卦总览 + 典藏印章 -->
                  <div class="bg-[#101013] border border-[#2b251d] rounded-xl p-3 space-y-1.5 text-center">
                    <div class="flex items-center justify-center gap-3 flex-wrap">
                      <!-- 本卦 -->
                      <div class="space-y-0.5">
                        <span class="text-[9px] text-[#8e8576] tracking-widest font-mono">【本卦 · 主运】</span>
                        <div class="text-base font-bold text-[#dfbc74] flex items-center justify-center gap-1">
                          <span class="font-mono text-sm">{{ todayResult.symbol }}</span>
                          <span>【{{ todayResult.name }}】</span>
                        </div>
                        <div class="text-[10px] text-[#8e8576]">
                          上{{ todayResult.upperTrigram }}下{{ todayResult.lowerTrigram }} · {{ todayResult.nature }}
                        </div>
                      </div>

                      <!-- 动爻转换指示 -->
                      <div v-if="changeYaoIndices.length > 0 && changedHexagram" class="flex flex-col items-center">
                        <span class="text-[#c5a059] text-xs">➔</span>
                        <span class="text-[9px] text-[#b83b3b] pt-0.5">
                          动在{{ changeYaoIndices.map(i => YAO_NAMES[i]).join('、') }}
                        </span>
                      </div>

                      <!-- 之卦 -->
                      <div v-if="changeYaoIndices.length > 0 && changedHexagram" class="space-y-0.5">
                        <span class="text-[9px] text-[#8e8576] tracking-widest font-mono">【之卦 · 变运】</span>
                        <div class="text-base font-bold text-[#c8bfae] flex items-center justify-center gap-1">
                          <span class="font-mono text-sm">{{ changedHexagram.symbol }}</span>
                          <span>【{{ changedHexagram.name }}】</span>
                        </div>
                        <div class="text-[10px] text-[#8e8576]">
                          上{{ changedHexagram.upperTrigram }}下{{ changedHexagram.lowerTrigram }} · {{ changedHexagram.nature }}
                        </div>
                      </div>

                      <!-- 金石古印徽章 -->
                      <div class="ml-1">
                        <span class="px-2.5 py-1 rounded text-xs font-bold inline-block" :class="luckBadgeClass">
                          {{ todayResult.luckTitle }}
                        </span>
                      </div>
                    </div>

                    <!-- 《文王金钱课》断易诗 -->
                    <div class="pt-1.5 border-t border-[#242018]">
                      <p class="text-xs text-[#dfbc74] italic leading-relaxed tracking-wider">
                        “{{ todayResult.verse }}”
                      </p>
                    </div>
                  </div>

                  <!-- 2. 周易卦辞与孔子大象传 -->
                  <div class="bg-[#101013] border border-[#252018] rounded-xl p-2.5 space-y-1.5 text-[11px] leading-relaxed">
                    <div>
                      <span class="text-[#c5a059] font-bold">文王卦辞：</span>
                      <span class="text-[#dfd7c8]">{{ todayResult.guaci }}</span>
                    </div>
                    <div class="border-t border-[#201d16] pt-1">
                      <span class="text-[#8ba4b8] font-bold">孔子象传：</span>
                      <span class="text-[#dfd7c8]">{{ todayResult.daxiang }}</span>
                    </div>
                    <div class="border-t border-[#201d16] pt-1">
                      <span class="text-[#8bb896] font-bold">灵机断释：</span>
                      <span class="text-[#b8af9e]">{{ todayResult.interpretation }}</span>
                    </div>
                  </div>

                  <!-- 3. 今日宜忌 (完整呈现无裁切) -->
                  <div class="bg-[#101013] border border-[#26221a] rounded-xl px-3 py-2 space-y-1.5 text-[11px] leading-relaxed">
                    <div class="flex items-start gap-2">
                      <span class="px-1.5 py-0.5 rounded bg-[#182a1d] border border-[#27422e] text-[#6bb57b] text-[10px] font-bold shrink-0">宜</span>
                      <span class="text-[#dfd7c8] leading-snug">{{ todayResult.yi }}</span>
                    </div>
                    <div class="flex items-start gap-2 border-t border-[#1e1b15] pt-1.5">
                      <span class="px-1.5 py-0.5 rounded bg-[#2b1818] border border-[#472727] text-[#c56b6b] text-[10px] font-bold shrink-0">忌</span>
                      <span class="text-[#dfd7c8] leading-snug">{{ todayResult.ji }}</span>
                    </div>
                  </div>

                  <!-- 4. 气象锦囊一行 -->
                  <div class="bg-[#101013] border border-[#2b251d] py-1.5 px-3 rounded-lg flex items-center justify-between text-[10px] text-[#a09583] font-mono">
                    <div>吉数：<span class="text-[#dfbc74] font-bold">{{ todayResult.luckyNumber }}</span></div>
                    <div>吉色：<span class="text-[#dfbc74] font-bold">{{ todayResult.luckyColor }}</span></div>
                    <div>贵人方：<span class="text-[#dfbc74] font-bold">{{ todayResult.luckyCompass }}方</span></div>
                    <div>古语：<span class="text-[#dfbc74] font-serif">{{ todayResult.classicQuote }}</span></div>
                  </div>

                  <!-- 5. 底部操作栏 -->
                  <div class="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      @click="copyFortuneText"
                      class="flex-1 py-2 rounded-lg bg-[#7a5c24] hover:bg-[#8f6d2b] text-[#fdf8ee] text-xs font-serif transition-all active:scale-95 cursor-pointer tracking-wider text-center shadow-sm"
                    >
                      誊录签辞
                    </button>
                    <button
                      type="button"
                      @click="resetDivination"
                      class="py-2 px-3.5 rounded-lg bg-[#1a1a20] hover:bg-[#23232c] text-[#c5a059] border border-[#383126] text-xs font-serif transition-all active:scale-95 cursor-pointer"
                    >
                      净手再筮
                    </button>
                    <button
                      type="button"
                      @click="closeModal"
                      class="py-2 px-3.5 rounded-lg bg-[#141418] hover:bg-[#1a1a20] text-[#8e8576] hover:text-[#dfd7c8] border border-[#28251e] text-xs font-serif transition-all active:scale-95 cursor-pointer"
                    >
                      收起
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import * as THREE from 'three'
import { ElMessage } from 'element-plus'
import { getHexagramByBinary, type HexagramData } from '../utils/ichingData'
import {
  onWindGust,
  registerCoinPosition,
  unregisterCoinPosition,
  onCoinSubmergedStateChange,
  isCoinSubmerged
} from '../utils/wind'

// --- 铜钱挂坠与微风/近距鼠标交互物理模型 ---
const coinCharmRef = ref<HTMLElement | null>(null)
const coinSwayAngle = ref(0)
const isSubmerged = ref(isCoinSubmerged()) // 是否已被水面浸没落水
let angularVel = 0
let mouseDragBias = 0
let lastMouseX = -9999
let lastMoveTime = 0
let unbindWindListener: (() => void) | null = null
let unbindSubmergeListener: (() => void) | null = null
let swingAnimId: number | null = null

const coinWindStyle = computed(() => ({
  transform: `rotate(${coinSwayAngle.value.toFixed(2)}deg)`,
  transformOrigin: 'top center',
}))

function handlePointerNearCoin(e: MouseEvent) {
  if (isOpen.value || !coinCharmRef.value) return

  const now = performance.now()
  const dt = Math.max(now - lastMoveTime, 16)
  const mx = e.clientX
  const my = e.clientY

  if (lastMouseX === -9999) {
    lastMouseX = mx
    lastMoveTime = now
    return
  }

  const dMouseX = mx - lastMouseX
  const rect = coinCharmRef.value.getBoundingClientRect()
  const coinCenterX = rect.left + rect.width / 2
  const coinCenterY = rect.top + rect.height / 2

  // 计算鼠标距离铜钱中心的欧式距离
  const distToCoin = Math.hypot(mx - coinCenterX, my - coinCenterY)
  const INFLUENCE_RADIUS = 120 // 靠近 120px 范围内产生微风与跟随效应

  if (distToCoin < INFLUENCE_RADIUS) {
    const weight = (INFLUENCE_RADIUS - distToCoin) / INFLUENCE_RADIUS
    // 1. 鼠标移动速度带来的角冲量 (向左移向左轻晃，向右移向右轻晃)
    const speedX = dMouseX / dt
    const impulse = speedX * weight * 0.85
    angularVel = Math.max(-1.8, Math.min(1.8, angularVel + impulse))

    // 2. 鼠标相对于铜钱位置的轻微位置牵引 (柔和轻微跟随指针)
    const relOffsetRatio = (mx - coinCenterX) / INFLUENCE_RADIUS
    mouseDragBias = relOffsetRatio * 1.5 * weight
  }

  lastMouseX = mx
  lastMoveTime = now
}

function updateCoinSwingPhysics() {
  const stiffness = 0.05
  const damping = 0.93

  // 恢复力向目标偏角靠拢 (无鼠标牵引时 target 为 0)
  const accel = -stiffness * (coinSwayAngle.value - mouseDragBias)
  angularVel = (angularVel + accel) * damping
  coinSwayAngle.value += angularVel

  // 严格限制最大摆幅在 ±2.8° 以内，轻柔微晃，绝不过度
  coinSwayAngle.value = Math.max(-2.8, Math.min(2.8, coinSwayAngle.value))

  // 鼠标牵引偏差逐渐自然消退
  mouseDragBias *= 0.88

  if (Math.abs(coinSwayAngle.value) < 0.01 && Math.abs(angularVel) < 0.01 && Math.abs(mouseDragBias) < 0.01) {
    coinSwayAngle.value = 0
    angularVel = 0
    mouseDragBias = 0
  }

  swingAnimId = requestAnimationFrame(updateCoinSwingPhysics)
}

const STORAGE_KEY_FORTUNE = 'myblog_daily_iching_fortune_v3'
const STORAGE_KEY_MUTED = 'myblog_fortune_muted'

// 爻位名称 (自下而上)
const YAO_NAMES = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']

// 单爻数据
interface YaoResult {
  score: number          // 点数和: 6, 7, 8, 9
  name: string           // 老阴、少阳、少阴、老阳
  isYang: boolean        // 阳爻(1) 还是 阴爻(0)
  isChanging: boolean    // 是否动爻 (6为老阴动，9为老阳动)
  coinFaces: boolean[]   // 三枚铜钱正反面 (true: 背面/阳3, false: 字面/阴2)
}

const isOpen = ref(false)
const isPulling = ref(false)
const isTossing = ref(false)
const isMuted = ref(false)

const canvas3dRef = ref<HTMLCanvasElement | null>(null)
let resizeObserver: ResizeObserver | null = null

// 右侧面板视图：'reading' 断卦签辞 / 'yao' 六爻图谱
const rightTab = ref<'reading' | 'yao'>('reading')

// 当前六爻推演列表 (长度 0 至 6，自初爻向上累积)
const yaos = ref<YaoResult[]>([])

// 卦象结果
const todayResult = ref<HexagramData | null>(null)
const changedHexagram = ref<HexagramData | null>(null)
const changeYaoIndices = ref<number[]>([])

const luckBadgeClass = computed(() => {
  if (!todayResult.value) return ''
  const map: Record<string, string> = {
    supreme: 'bg-[#7a2828] text-[#f7e8aa] border border-[#963737]', // 朱砂金文印
    great: 'bg-[#223d2f] text-[#daf2e2] border border-[#335944]',   // 沉香翡翠印
    medium: 'bg-[#4d3d22] text-[#faedd4] border border-[#6b5530]',  // 老铜沉金印
    small: 'bg-[#31303d] text-[#e0e0ea] border border-[#484659]',   // 墨青印
    peace: 'bg-[#24242a] text-[#d6d6dc] border border-[#3c3c46]'    // 玄黑印
  }
  return map[todayResult.value.luckLevel] || 'bg-[#4d3d22] text-[#faedd4] border border-[#6b5530]'
})

// ==========================================
// Web Audio 真实铜钱碰撞音效合成器 (0网络依赖)
// ==========================================
function playCoinSound(intensity = 1.0) {
  if (isMuted.value) return
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    // 铜钱高频金属泛音打击模型
    const frequencies = [2400, 3600, 4800, 6200]
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle'
      osc.frequency.setValueAtTime(freq + (Math.random() - 0.5) * 80, now + idx * 0.015)

      const baseVolume = 0.05 * intensity
      gain.gain.setValueAtTime(baseVolume, now + idx * 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.015 + 0.12)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + idx * 0.015)
      osc.stop(now + idx * 0.015 + 0.13)
    })
  } catch {
    // 忽略音频限制
  }
}

function toggleMute() {
  isMuted.value = !isMuted.value
  localStorage.setItem(STORAGE_KEY_MUTED, isMuted.value ? 'true' : 'false')
}

// ==========================================
// Three.js 3D 鎏金三枚铜钱法盘系统
// ==========================================
let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let animFrameId: number | null = null

interface CoinEntity {
  group: THREE.Group
  pos: THREE.Vector3
  vel: THREE.Vector3
  rot: THREE.Euler
  rotVel: THREE.Vector3
  restPos: THREE.Vector3
  targetPos: THREE.Vector3
  targetRotX: number
  targetRotZ: number
  isResting: boolean
}

let coins: CoinEntity[] = []
let particles: THREE.Points | null = null

// 1. 生成铜钱字面贴图 (字面为阴·数2，刻“乾坤通宝”)
function createCoinFrontTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const cx = 256, cy = 256

  const grad = ctx.createRadialGradient(cx, cy, 50, cx, cy, 256)
  grad.addColorStop(0, '#f59e0b')
  grad.addColorStop(0.35, '#d97706')
  grad.addColorStop(0.7, '#b45309')
  grad.addColorStop(0.92, '#78350f')
  grad.addColorStop(1, '#451a03')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(cx, cy, 256, 0, Math.PI * 2)
  ctx.fill()

  // 铸造微同心纹
  for (let r = 70; r < 240; r += 6) {
    ctx.strokeStyle = `rgba(254, 240, 138, ${0.04 + (r % 12 === 0 ? 0.04 : 0)})`
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 外圈凸起金环
  ctx.strokeStyle = '#fef08a'
  ctx.lineWidth = 15
  ctx.beginPath()
  ctx.arc(cx, cy, 238, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = '#451a03'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy, 228, 0, Math.PI * 2)
  ctx.stroke()

  // 方孔凸起金边
  const sqHalf = 58
  ctx.strokeStyle = '#fef08a'
  ctx.lineWidth = 12
  ctx.strokeRect(cx - sqHalf, cy - sqHalf, sqHalf * 2, sqHalf * 2)

  ctx.strokeStyle = '#451a03'
  ctx.lineWidth = 3
  ctx.strokeRect(cx - sqHalf - 7, cy - sqHalf - 7, (sqHalf + 7) * 2, (sqHalf + 7) * 2)

  // 铭文：乾 坤 通 宝
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = 'bold 74px "Songti SC", "SimSun", "Noto Serif SC", serif'

  const chars = [
    { text: '乾', x: cx, y: cy - 146 },
    { text: '坤', x: cx, y: cy + 146 },
    { text: '通', x: cx + 146, y: cy },
    { text: '宝', x: cx - 146, y: cy }
  ]

  chars.forEach(c => {
    ctx.fillStyle = 'rgba(40, 18, 0, 0.9)'
    ctx.fillText(c.text, c.x + 3, c.y + 3)
    ctx.fillStyle = '#fef08a'
    ctx.fillText(c.text, c.x, c.y)
    ctx.strokeStyle = '#b45309'
    ctx.lineWidth = 2
    ctx.strokeText(c.text, c.x, c.y)
  })

  // 青铜氧化微颗粒
  for (let i = 0; i < 350; i++) {
    const rx = Math.random() * 512
    const ry = Math.random() * 512
    const d = Math.hypot(rx - cx, ry - cy)
    if (d > 65 && d < 230) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(254, 240, 138, 0.15)' : 'rgba(30, 15, 0, 0.25)'
      ctx.fillRect(rx, ry, 2, 2)
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// 2. 生成铜钱背面贴图 (背面为阳·数3，刻八卦纹)
function createCoinBackTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const cx = 256, cy = 256

  const grad = ctx.createRadialGradient(cx, cy, 50, cx, cy, 256)
  grad.addColorStop(0, '#f59e0b')
  grad.addColorStop(0.35, '#d97706')
  grad.addColorStop(0.7, '#b45309')
  grad.addColorStop(0.92, '#78350f')
  grad.addColorStop(1, '#451a03')
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(cx, cy, 256, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#fef08a'
  ctx.lineWidth = 15
  ctx.beginPath()
  ctx.arc(cx, cy, 238, 0, Math.PI * 2)
  ctx.stroke()

  const sqHalf = 58
  ctx.strokeStyle = '#fef08a'
  ctx.lineWidth = 12
  ctx.strokeRect(cx - sqHalf, cy - sqHalf, sqHalf * 2, sqHalf * 2)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 上乾 ☰
  ctx.font = 'bold 64px "PingFang SC", "Microsoft YaHei", serif'
  ctx.fillStyle = 'rgba(40, 18, 0, 0.9)'
  ctx.fillText('☰', cx + 2, cy - 146 + 2)
  ctx.fillStyle = '#fef08a'
  ctx.fillText('☰', cx, cy - 146)

  // 下坤 ☷
  ctx.fillStyle = 'rgba(40, 18, 0, 0.9)'
  ctx.fillText('☷', cx + 2, cy + 146 + 2)
  ctx.fillStyle = '#fef08a'
  ctx.fillText('☷', cx, cy + 146)

  // 左右吉祥篆文 "顺" "泰"
  ctx.font = 'bold 54px "Songti SC", "SimSun", serif'
  ctx.fillStyle = 'rgba(40, 18, 0, 0.9)'
  ctx.fillText('泰', cx - 146 + 2, cy + 2)
  ctx.fillStyle = '#fde047'
  ctx.fillText('泰', cx - 146, cy)

  ctx.fillStyle = 'rgba(40, 18, 0, 0.9)'
  ctx.fillText('顺', cx + 146 + 2, cy + 2)
  ctx.fillStyle = '#fde047'
  ctx.fillText('顺', cx + 146, cy)

  for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
    const px = cx + Math.cos(a) * 190
    const py = cy + Math.sin(a) * 190
    ctx.fillStyle = '#fef08a'
    ctx.beginPath()
    ctx.arc(px, py, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// 3. 生成法盘底图 (黑曜石描金八卦盘)
function createPlateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!
  const cx = 512, cy = 512

  const grad = ctx.createRadialGradient(cx, cy, 120, cx, cy, 512)
  grad.addColorStop(0, '#161412')
  grad.addColorStop(0.55, '#0e0d0b')
  grad.addColorStop(0.9, '#070605')
  grad.addColorStop(1, '#020202')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 1024, 1024)

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.55)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.arc(cx, cy, 470, 0, Math.PI * 2)
  ctx.stroke()

  ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, 415, 0, Math.PI * 2)
  ctx.stroke()

  const trigrams = ['☰ 乾', '☱ 兑', '☲ 离', '☳ 震', '☴ 巽', '☵ 坎', '☶ 艮', '☷ 坤']
  ctx.font = 'bold 36px "Songti SC", "SimSun", serif'
  ctx.fillStyle = 'rgba(218, 185, 107, 0.85)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  trigrams.forEach((tri, i) => {
    const angle = (i * Math.PI) / 4 - Math.PI / 2
    const tx = cx + Math.cos(angle) * 442
    const ty = cy + Math.sin(angle) * 442
    ctx.save()
    ctx.translate(tx, ty)
    ctx.rotate(angle + Math.PI / 2)
    ctx.fillText(tri, 0, 0)
    ctx.restore()
  })

  // 盘心太极符
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(cx, cy, 160, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = 'rgba(212, 175, 55, 0.15)'
  ctx.beginPath()
  ctx.arc(cx, cy, 160, -Math.PI / 2, Math.PI / 2)
  ctx.arc(cx, cy + 80, 80, Math.PI / 2, -Math.PI / 2, true)
  ctx.arc(cx, cy - 80, 80, Math.PI / 2, -Math.PI / 2, false)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// 4. 构建单枚 3D 铜钱 Mesh (外圆内方倒角)
function buildCoinGroup(frontTex: THREE.CanvasTexture, backTex: THREE.CanvasTexture): THREE.Group {
  const group = new THREE.Group()

  const coinShape = new THREE.Shape()
  const r = 0.95
  coinShape.absarc(0, 0, r, 0, Math.PI * 2, false)

  const hole = new THREE.Path()
  const hw = 0.215
  hole.moveTo(-hw, -hw)
  hole.lineTo(hw, -hw)
  hole.lineTo(hw, hw)
  hole.lineTo(-hw, hw)
  hole.lineTo(-hw, -hw)
  coinShape.holes.push(hole)

  const extrudeSettings = {
    depth: 0.08,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025
  }
  const bodyGeo = new THREE.ExtrudeGeometry(coinShape, extrudeSettings)
  bodyGeo.center()

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.85,
    roughness: 0.28
  })
  const bodyMesh = new THREE.Mesh(bodyGeo, rimMaterial)
  group.add(bodyMesh)

  // 正面贴图板 (字面)
  const faceGeo = new THREE.ShapeGeometry(coinShape)
  faceGeo.center()

  const frontMat = new THREE.MeshStandardMaterial({
    map: frontTex,
    metalness: 0.82,
    roughness: 0.3,
    side: THREE.FrontSide
  })
  const frontMesh = new THREE.Mesh(faceGeo, frontMat)
  frontMesh.position.z = 0.042
  group.add(frontMesh)

  // 背面贴图板 (八卦面)
  const backMat = new THREE.MeshStandardMaterial({
    map: backTex,
    metalness: 0.82,
    roughness: 0.3,
    side: THREE.FrontSide
  })
  const backMesh = new THREE.Mesh(faceGeo, backMat)
  backMesh.rotation.y = Math.PI
  backMesh.position.z = -0.042
  group.add(backMesh)

  return group
}

function initThreeScene() {
  const canvas = canvas3dRef.value
  if (!canvas) return

  const width = canvas.clientWidth || 450
  const height = canvas.clientHeight || 450

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a0d)

  camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 50)
  camera.position.set(0, 5.0, 5.1)
  camera.lookAt(0, 0, 0.1)

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true

  // 监听容器尺寸变化动态响应，杜绝拉伸失真
  const handleResize = () => {
    if (!canvas || !renderer || !camera) return
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (w > 0 && h > 0) {
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
  }

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(canvas)
  }

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.85)
  scene.add(ambientLight)

  const keyLight = new THREE.DirectionalLight(0xfef08a, 2.5)
  keyLight.position.set(3, 7, 4)
  scene.add(keyLight)

  const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.8)
  rimLight.position.set(-4, 5, -2)
  scene.add(rimLight)

  const altarPointLight = new THREE.PointLight(0xf59e0b, 1.2, 8)
  altarPointLight.position.set(0, 2.5, 0)
  scene.add(altarPointLight)

  const plateTex = createPlateTexture()
  const plateGeo = new THREE.CylinderGeometry(2.8, 2.9, 0.12, 48)
  const plateMat = new THREE.MeshStandardMaterial({
    map: plateTex,
    roughness: 0.45,
    metalness: 0.25
  })
  const plateMesh = new THREE.Mesh(plateGeo, plateMat)
  plateMesh.position.y = -0.06
  scene.add(plateMesh)

  const rimTorusGeo = new THREE.TorusGeometry(2.85, 0.05, 12, 48)
  const rimTorusMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.85,
    roughness: 0.25
  })
  const rimTorusMesh = new THREE.Mesh(rimTorusGeo, rimTorusMat)
  rimTorusMesh.rotation.x = Math.PI / 2
  rimTorusMesh.position.y = 0.01
  scene.add(rimTorusMesh)

  // 灵气粒子
  const particleCount = 40
  const particleGeo = new THREE.BufferGeometry()
  const particlePos = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.random() * 2.5
    particlePos[i * 3] = Math.cos(angle) * radius
    particlePos[i * 3 + 1] = 0.1 + Math.random() * 1.5
    particlePos[i * 3 + 2] = Math.sin(angle) * radius
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3))
  const particleMat = new THREE.PointsMaterial({
    color: 0xfef08a,
    size: 0.05,
    transparent: true,
    opacity: 0.6
  })
  particles = new THREE.Points(particleGeo, particleMat)
  scene.add(particles)

  const frontTex = createCoinFrontTexture()
  const backTex = createCoinBackTexture()

  const initialPositions = [
    new THREE.Vector3(-1.15, 0.035, 0.15),
    new THREE.Vector3(0.0, 0.035, 0.35),
    new THREE.Vector3(1.15, 0.035, 0.05)
  ]

  coins = initialPositions.map((pos, idx) => {
    const group = buildCoinGroup(frontTex, backTex)
    group.scale.set(0.7, 0.7, 0.7)
    group.rotation.x = -Math.PI / 2 // 默认字面朝上
    group.rotation.z = (idx - 1) * 0.18
    group.position.copy(pos)
    scene!.add(group)

    return {
      group,
      pos: pos.clone(),
      vel: new THREE.Vector3(0, 0, 0),
      rot: group.rotation.clone(),
      rotVel: new THREE.Vector3(0, 0, 0),
      restPos: pos.clone(),
      targetPos: pos.clone(),
      targetRotX: -Math.PI / 2,
      targetRotZ: (idx - 1) * 0.18,
      isResting: true
    }
  })

  // 如果已存在已起爻的结果，恢复最后一爻的三枚铜钱正反面
  if (yaos.value.length > 0) {
    const lastYao = yaos.value[yaos.value.length - 1]
    if (lastYao && lastYao.coinFaces) {
      lastYao.coinFaces.forEach((isBack, i) => {
        const c = coins[i]
        if (c) {
          c.targetRotX = isBack ? Math.PI / 2 : -Math.PI / 2
          c.rot.x = c.targetRotX
          c.group.rotation.x = c.targetRotX
        }
      })
    }
  }

  let clock = new THREE.Clock()
  const renderLoop = () => {
    animFrameId = requestAnimationFrame(renderLoop)
    const delta = Math.min(clock.getDelta(), 0.08)

    if (particles) {
      const posArr = particles.geometry.attributes.position.array as Float32Array
      for (let i = 1; i < posArr.length; i += 3) {
        posArr[i] += delta * 0.15
        if (posArr[i] > 1.8) posArr[i] = 0.05
      }
      particles.geometry.attributes.position.needsUpdate = true
      particles.rotation.y += delta * 0.05
    }

    // 预分配法向量辅助计算圆盘实际最低点，零垃圾回收负担
    const tempCoinNormal = new THREE.Vector3()
    const R_COIN = 0.665 // 真实圆盘半径
    const H_COIN = 0.032 // 真实半厚度

    coins.forEach((coin) => {
      // 当前倾角下圆盘最低点相对于中心的下垂距离：R*sqrt(1-ny^2) + H*|ny|
      tempCoinNormal.set(0, 0, 1).applyEuler(coin.rot)
      const ny = Math.abs(tempCoinNormal.y)
      const currentMinCenterY = R_COIN * Math.sqrt(Math.max(0, 1 - ny * ny)) + H_COIN * ny

      if (!coin.isResting) {
        // 重力加速
        coin.vel.y -= 13.5 * delta

        // 水平回中引力：空中持续将硬币导向专属目标落点，杜绝连续投掷时的位移累加漂移
        coin.vel.x += (coin.targetPos.x - coin.pos.x) * 3.5 * delta
        coin.vel.z += (coin.targetPos.z - coin.pos.z) * 3.5 * delta
        coin.vel.x *= 0.985
        coin.vel.z *= 0.985

        coin.pos.addScaledVector(coin.vel, delta)

        // 强边界安全兜底：盘面半径 2.8，限制硬币绝对不超过半径 1.6，永不飞出盘子
        const dist = Math.hypot(coin.pos.x, coin.pos.z)
        if (dist > 1.6) {
          const factor = 1.6 / dist
          coin.pos.x *= factor
          coin.pos.z *= factor
          coin.vel.x *= -0.4
          coin.vel.z *= -0.4
        }

        // 旋转姿态更新
        coin.rot.x += coin.rotVel.x * delta
        coin.rot.y += coin.rotVel.y * delta
        coin.rot.z += coin.rotVel.z * delta

        // 碰撞盘面判定：只有在向下坠落 (coin.vel.y < 0) 且最低边缘触碰到 y = 0 时才触发碰撞
        if (coin.vel.y < 0 && coin.pos.y <= currentMinCenterY) {
          coin.pos.y = currentMinCenterY
          if (coin.vel.y < -0.8) {
            // 边缘触盘弹跳与力矩抚平：地面对边缘的撞击力迫使硬币迅速向平放姿态抚平
            coin.vel.y = -coin.vel.y * 0.32
            coin.vel.x *= 0.6
            coin.vel.z *= 0.6
            coin.rotVel.multiplyScalar(0.35)
            coin.rot.x += (coin.targetRotX - coin.rot.x) * 0.45
            coin.rot.z += (coin.targetRotZ - coin.rot.z) * 0.45
            playCoinSound(0.65)
          } else {
            // 能量耗尽，平稳落定
            coin.vel.set(0, 0, 0)
            coin.isResting = true
            playCoinSound(0.35)
          }
        }
      } else {
        // 静止落定状态：姿态迅速平滑收敛至平躺
        coin.rot.x += (coin.targetRotX - coin.rot.x) * Math.min(delta * 16, 1)
        coin.rot.y += (0 - coin.rot.y) * Math.min(delta * 16, 1)
        coin.rot.z += (coin.targetRotZ - coin.rot.z) * Math.min(delta * 16, 1)

        // 高度实时跟随当前姿态的接触面严格锁定，整个收敛过程中最低点恒定贴合 y = 0，绝对不穿模！
        tempCoinNormal.set(0, 0, 1).applyEuler(coin.rot)
        const restNy = Math.abs(tempCoinNormal.y)
        const exactRestY = R_COIN * Math.sqrt(Math.max(0, 1 - restNy * restNy)) + H_COIN * restNy
        coin.pos.y = exactRestY

        // 水平位置精准吸附至本次目标落点
        coin.pos.x += (coin.targetPos.x - coin.pos.x) * Math.min(delta * 10, 1)
        coin.pos.z += (coin.targetPos.z - coin.pos.z) * Math.min(delta * 10, 1)
      }

      coin.group.position.copy(coin.pos)
      coin.group.rotation.copy(coin.rot)
    })

    renderer?.render(scene!, camera!)
  }
  renderLoop()
}

// ==========================================
// 正统文王六爻成卦算法 (火珠林法)
// ==========================================

/**
 * 掷单爻核心计算:
 * 规则 (《火珠林》正典):
 * 字面为阴，数 2;
 * 背面为阳，数 3.
 * 三枚铜钱组合：
 * 1. 三字无背 (2+2+2 = 6): 老阴 (交阴，动爻 ✕，本卦为阴爻0，变卦化为阳爻1)
 * 2. 一背两字 (3+2+2 = 7): 少阳 (单阳，静爻，本卦为阳爻1，不变)
 * 3. 两背一字 (3+3+2 = 8): 少阴 (拆阴，静爻，本卦为阴爻0，不变)
 * 4. 三背无字 (3+3+3 = 9): 老阳 (重阳，动爻 ○，本卦为阳爻1，变卦化为阴爻0)
 */
function tossSingleYaoAnimation(): Promise<YaoResult> {
  return new Promise(resolve => {
    isTossing.value = true
    playCoinSound(1.2)

    // 随机三枚铜钱正反面 (true 为 背面/阳3，false 为 字面/阴2)
    const coinOutcomes = [Math.random() > 0.5, Math.random() > 0.5, Math.random() > 0.5]
    const backCount = coinOutcomes.filter(Boolean).length // 背面(阳)数量

    let score = 0
    let name = ''
    let isYang = false
    let isChanging = false

    if (backCount === 0) {
      score = 6
      name = '老阴 (六·动)'
      isYang = false
      isChanging = true
    } else if (backCount === 1) {
      score = 7
      name = '少阳 (七·静)'
      isYang = true
      isChanging = false
    } else if (backCount === 2) {
      score = 8
      name = '少阴 (八·静)'
      isYang = false
      isChanging = false
    } else {
      score = 9
      name = '老阳 (九·动)'
      isYang = true
      isChanging = true
    }

    // 给 3D 铜钱施加抛掷物理参数
    coins.forEach((coin, idx) => {
      coin.isResting = false

      // 计算本次落点：围绕固定 anchor 产生自然微随机偏移 (±0.25)，绝不累积漂移
      const offsetX = (Math.random() - 0.5) * 0.3
      const offsetZ = (Math.random() - 0.5) * 0.3
      coin.targetPos.set(
        coin.restPos.x + offsetX,
        0.035,
        coin.restPos.z + offsetZ
      )

      // 抬升起步高度，确保起飞瞬间脱离地面
      coin.pos.y = 0.08

      // 垂直发射初速度 (强劲腾空)
      coin.vel.y = 5.5 + Math.random() * 0.7

      // 水平速度：基于空中总飞行时间(约0.75s)精准引导至目标落点
      const flightTime = 0.75
      coin.vel.x = (coin.targetPos.x - coin.pos.x) / flightTime + (Math.random() - 0.5) * 0.3
      coin.vel.z = (coin.targetPos.z - coin.pos.z) / flightTime + (Math.random() - 0.5) * 0.3

      // 剧烈三维立体翻转角速度
      coin.rotVel.x = (16 + Math.random() * 10) * (Math.random() > 0.5 ? 1 : -1)
      coin.rotVel.y = (10 + Math.random() * 8) * (Math.random() > 0.5 ? 1 : -1)
      coin.rotVel.z = (8 + Math.random() * 6) * (Math.random() > 0.5 ? 1 : -1)

      // 目标平躺角度：
      // 背面(阳)向上时为 Math.PI / 2；字面(阴)向上时为 -Math.PI / 2
      const isBack = coinOutcomes[idx]
      coin.targetRotX = isBack ? Math.PI / 2 : -Math.PI / 2
      coin.targetRotZ = (idx - 1) * 0.18 + (Math.random() - 0.5) * 0.2
    })

    setTimeout(() => {
      isTossing.value = false
      resolve({
        score,
        name,
        isYang,
        isChanging,
        coinFaces: coinOutcomes
      })
    }, 1050)
  })
}

// 手动掷下一爻
async function handleTossNext() {
  if (isTossing.value || yaos.value.length >= 6) return
  const result = await tossSingleYaoAnimation()
  yaos.value.push(result)

  // 若已掷满六爻，计算本卦与变卦
  if (yaos.value.length === 6) {
    calculateHexagrams()
  }
}

// 一键自动掷满六爻 (快捷模式)
async function tossAllSix() {
  if (isTossing.value) return
  while (yaos.value.length < 6) {
    const result = await tossSingleYaoAnimation()
    yaos.value.push(result)
    // 间隔等待铜钱稳稳落定并让用户看清爻象
    await new Promise(r => setTimeout(r, 260))
  }
  calculateHexagrams()
}

// 依据六爻结果推演本卦与变卦
function calculateHexagrams() {
  if (yaos.value.length !== 6) return

  // 1. 本卦二进制 (自初爻至上爻: 0为阴, 1为阳)
  const baseBinary = yaos.value.map(y => (y.isYang ? '1' : '0')).join('')

  // 2. 统计变爻
  const changeIndices: number[] = []
  const changedBits = yaos.value.map((y, idx) => {
    if (y.isChanging) {
      changeIndices.push(idx)
      // 老阳(9)变阴(0)，老阴(6)变阳(1)
      return y.score === 9 ? '0' : '1'
    }
    return y.isYang ? '1' : '0'
  })
  const changedBinary = changedBits.join('')

  changeYaoIndices.value = changeIndices

  // 3. 查询周易典籍库
  todayResult.value = getHexagramByBinary(baseBinary)
  if (changeIndices.length > 0) {
    changedHexagram.value = getHexagramByBinary(changedBinary)
  } else {
    changedHexagram.value = null
  }

  // 4. 持久化当日首签
  const todayStr = new Date().toISOString().split('T')[0]
  const record = {
    date: todayStr,
    yaos: yaos.value,
    hexagram: todayResult.value,
    changedHexagram: changedHexagram.value,
    changeYaoIndices: changeIndices
  }
  localStorage.setItem(STORAGE_KEY_FORTUNE, JSON.stringify(record))

  // 六爻掷定后稍作停顿，自动切换至卦象详解视图
  setTimeout(() => {
    rightTab.value = 'reading'
  }, 900)
}

// 重新起卦 (重置法盘)
function resetDivination() {
  yaos.value = []
  todayResult.value = null
  changedHexagram.value = null
  changeYaoIndices.value = []
  rightTab.value = 'reading'
  coins.forEach(c => {
    c.targetPos.copy(c.restPos)
    c.targetRotX = -Math.PI / 2
    c.isResting = true
    c.vel.set(0, 0, 0)
  })
}

// 复制签文
async function copyFortuneText() {
  if (!todayResult.value) return
  const r = todayResult.value
  let text = `【文王六爻 · 周易神课】\n`
  text += `本卦：【${r.name}】（${r.luckTitle}）\n`
  text += `卦象：上${r.upperTrigram}下${r.lowerTrigram} · ${r.nature}\n`
  if (changeYaoIndices.value.length > 0 && changedHexagram.value) {
    text += `动爻：动在${changeYaoIndices.value.map(i => YAO_NAMES[i]).join('、')}，之卦为【${changedHexagram.value.name}】\n`
  }
  text += `断易诗：“${r.verse}”\n`
  text += `文王卦辞：${r.guaci}\n`
  text += `孔子象传：${r.daxiang}\n`
  text += `灵机断释：${r.interpretation}\n`
  text += `今日宜：${r.yi}\n`
  text += `今日忌：${r.ji}\n`
  text += `吉数：${r.luckyNumber} · 贵人方位：${r.luckyCompass}方`

  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('签辞已誊录至剪贴板，福泽常伴。')
  } catch {
    ElMessage.info('复制未成，请截屏保存签辞。')
  }
}

// 弹窗显隐控制
function toggleModal() {
  isPulling.value = true
  setTimeout(() => {
    isPulling.value = false
  }, 220)

  isOpen.value = !isOpen.value

  if (isOpen.value) {
    loadCachedFortune()
    nextTick(() => {
      setTimeout(() => {
        initThreeScene()
      }, 60)
    })
  } else {
    disposeThree()
  }
}

function closeModal() {
  isOpen.value = false
  disposeThree()
}

// 缓存加载
function loadCachedFortune() {
  const cached = localStorage.getItem(STORAGE_KEY_FORTUNE)
  if (cached) {
    try {
      const data = JSON.parse(cached)
      const todayStr = new Date().toISOString().split('T')[0]
      if (data.date === todayStr && data.yaos && data.yaos.length === 6) {
        yaos.value = data.yaos
        todayResult.value = data.hexagram
        changedHexagram.value = data.changedHexagram
        changeYaoIndices.value = data.changeYaoIndices || []
        rightTab.value = 'reading'
        const lastYao = data.yaos[5]
        if (lastYao && lastYao.coinFaces && coins.length === 3) {
          lastYao.coinFaces.forEach((isBack: boolean, i: number) => {
            const c = coins[i]
            if (c) {
              c.targetRotX = isBack ? Math.PI / 2 : -Math.PI / 2
              c.rot.x = c.targetRotX
              c.group.rotation.x = c.targetRotX
            }
          })
        }
      } else {
        rightTab.value = 'reading'
      }
    } catch {
      rightTab.value = 'reading'
    }
  } else {
    rightTab.value = 'reading'
  }
}

function disposeThree() {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (animFrameId) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }
  if (renderer) {
    renderer.dispose()
    renderer = null
  }
  scene = null
  camera = null
  coins = []
  particles = null
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) {
    closeModal()
  }
}

onMounted(() => {
  const cachedMuted = localStorage.getItem(STORAGE_KEY_MUTED)
  if (cachedMuted === 'true') {
    isMuted.value = true
  }
  loadCachedFortune()
  window.addEventListener('keydown', onKeyDown)

  // 监听自然轻柔和风，驱动铜钱微微摇晃
  unbindWindListener = onWindGust((strength, dirX) => {
    const impulse = dirX * strength * 0.45
    angularVel = Math.max(-1.2, Math.min(1.2, angularVel + impulse))
  })

  // 监听铜钱落水沉浸状态
  unbindSubmergeListener = onCoinSubmergedStateChange((submerged) => {
    isSubmerged.value = submerged
  })

  // 实时向风场水面系统同步铜钱的视口绝对坐标 (供计算与水面波浪边缘的真实垂直距离)
  const syncCoinPos = () => {
    if (coinCharmRef.value) {
      const rect = coinCharmRef.value.getBoundingClientRect()
      registerCoinPosition(rect.left + rect.width / 2, rect.bottom)
    }
  }
  syncCoinPos()
  window.addEventListener('resize', syncCoinPos)

  window.addEventListener('mousemove', handlePointerNearCoin, { passive: true })
  swingAnimId = requestAnimationFrame(updateCoinSwingPhysics)
})

onUnmounted(() => {
  disposeThree()
  unregisterCoinPosition()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('mousemove', handlePointerNearCoin)

  if (unbindWindListener) {
    unbindWindListener()
    unbindWindListener = null
  }
  if (unbindSubmergeListener) {
    unbindSubmergeListener()
    unbindSubmergeListener = null
  }
  if (swingAnimId !== null) {
    cancelAnimationFrame(swingAnimId)
    swingAnimId = null
  }
})
</script>

<style scoped>
.coin-charm {
  transform-origin: top center;
}

/* 弹窗渐变动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.96) translateY(-10px);
}

/* 签文淡入 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

/* 细滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(245, 158, 11, 0.25);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(245, 158, 11, 0.45);
}
</style>
