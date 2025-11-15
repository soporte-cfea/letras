<template>
  <div class="rich-text-content" v-html="content"></div>
</template>

<script setup lang="ts">
export interface RichTextContentProps {
  content: string
}

const props = defineProps<RichTextContentProps>()
</script>

<style scoped>
.rich-text-content {
  color: var(--color-text);
  line-height: 1.6;
}

/* Estilos para el contenido HTML renderizado */
:deep(h1) {
  font-size: 2em;
  font-weight: bold;
  margin-top: 0;
  margin-bottom: 0.5em;
  color: var(--color-heading);
}

:deep(h1:first-child) {
  margin-top: 0;
}

:deep(h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
  color: var(--color-heading);
}

:deep(h2:first-child) {
  margin-top: 0;
}

:deep(h3) {
  font-size: 1.17em;
  font-weight: bold;
  margin-top: 0.75em;
  margin-bottom: 0.5em;
  color: var(--color-heading);
}

:deep(h3:first-child) {
  margin-top: 0;
}

:deep(h4) {
  font-size: 1em;
  font-weight: bold;
  margin-top: 0.75em;
  margin-bottom: 0.5em;
  color: var(--color-heading);
}

:deep(h4:first-child) {
  margin-top: 0;
}

:deep(h5) {
  font-size: 0.83em;
  font-weight: bold;
  margin-top: 0.75em;
  margin-bottom: 0.5em;
  color: var(--color-heading);
}

:deep(h5:first-child) {
  margin-top: 0;
}

:deep(h6) {
  font-size: 0.67em;
  font-weight: bold;
  margin-top: 0.75em;
  margin-bottom: 0.5em;
  color: var(--color-heading);
}

:deep(h6:first-child) {
  margin-top: 0;
}

:deep(p) {
  margin: 0.5em 0;
  color: var(--color-text);
}

:deep(p:first-child) {
  margin-top: 0;
}

:deep(p:last-child) {
  margin-bottom: 0;
}

:deep(strong) {
  font-weight: bold;
}

:deep(em) {
  font-style: italic;
}

:deep(u) {
  text-decoration: underline;
}

:deep(s) {
  text-decoration: line-through;
}

:deep(ul:not([data-type="taskList"])) {
  list-style-type: disc;
  padding-left: 1.5em;
  margin: 0.5em 0;
}

:deep(ul:not([data-type="taskList"]):first-child) {
  margin-top: 0;
}

:deep(ul:not([data-type="taskList"]):last-child) {
  margin-bottom: 0;
}

:deep(ol) {
  list-style-type: decimal;
  padding-left: 1.5em;
  margin: 0.5em 0;
}

:deep(ol:first-child) {
  margin-top: 0;
}

:deep(ol:last-child) {
  margin-bottom: 0;
}

:deep(li:not([data-type="taskItem"])) {
  display: list-item;
  margin: 0.5em 0;
  padding-left: 0.25em;
}

:deep(blockquote) {
  border-left: 4px solid var(--color-border);
  padding-left: 1em;
  margin: 0.75em 0;
  color: var(--color-text-soft);
  font-style: italic;
}

:deep(blockquote:first-child) {
  margin-top: 0;
}

:deep(blockquote:last-child) {
  margin-bottom: 0;
}

:deep(code) {
  background: var(--color-background-soft);
  padding: 0.2em 0.4em;
  border-radius: 0.25rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
  font-size: 0.9em;
  color: var(--color-text);
}

:deep(pre) {
  background: var(--color-background-soft);
  padding: 1em;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1em 0;
}

:deep(pre code) {
  background: transparent;
  padding: 0;
}

:deep(a) {
  color: var(--color-accent);
  text-decoration: underline;
  transition: color var(--transition-normal);
}

:deep(a:hover) {
  color: var(--color-accent-hover);
}

:deep(mark) {
  background: var(--color-warning);
  padding: 0.1em 0.2em;
  border-radius: 0.25rem;
}

:deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

:deep(table td),
:deep(table th) {
  border: 1px solid var(--color-border);
  padding: 0.5em;
  text-align: left;
}

:deep(table th) {
  background: var(--color-background-soft);
  font-weight: bold;
}

:deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1em 0;
}

:deep(ul[data-type="taskList"]) {
  list-style: none;
  padding-left: 0;
}

:deep(li[data-type="taskItem"]) {
  display: flex;
  align-items: flex-start;
  gap: 0.5em;
}

:deep(li[data-type="taskItem"] > label) {
  display: flex;
  align-items: center;
  gap: 0.5em;
  cursor: pointer;
}

:deep(li[data-type="taskItem"] > label > input[type="checkbox"]) {
  cursor: pointer;
}
</style>

