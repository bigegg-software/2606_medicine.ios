import React from 'react';
import {
  Image,
  Linking,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { AppTheme } from '@/common/theme';

type InlineNode =
  | { type: 'text'; text: string }
  | { type: 'br' }
  | { type: 'link'; href: string; children: InlineNode[] }
  | { type: 'bold'; children: InlineNode[] }
  | { type: 'italic'; children: InlineNode[] }
  | { type: 'underline'; children: InlineNode[] };

type BlockNode =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'heading'; level: number; children: InlineNode[] }
  | { type: 'list'; ordered: boolean; items: InlineNode[][] }
  | { type: 'image'; src: string }
  | { type: 'spacer' };

type TextToken = { kind: 'text'; value: string };
type TagToken = {
  kind: 'tag';
  name: string;
  closing: boolean;
  selfClosing: boolean;
  attrs: string;
};
type Token = TextToken | TagToken;

const BLOCK_TAGS = new Set([
  'p',
  'div',
  'section',
  'article',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'td',
  'th',
  'figure',
  'figcaption',
  'header',
  'footer',
  'main',
  'aside',
]);

function decodeEntities(input: string) {
  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&ldquo;/gi, '“')
    .replace(/&rdquo;/gi, '”')
    .replace(/&mdash;/gi, '—')
    .replace(/&#(\d+);/g, (_, code) => {
      const num = Number(code);
      return Number.isFinite(num) ? String.fromCharCode(num) : '';
    });
}

function getAttr(attrs: string, name: string) {
  const match =
    attrs.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i')) ||
    attrs.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, 'i')) ||
    attrs.match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, 'i'));
  return match?.[1]?.trim() ?? '';
}

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  const re = /<!--[\s\S]*?-->|<\/?([a-zA-Z0-9]+)([^>]*)>/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    if (match.index > last) {
      tokens.push({ kind: 'text', value: html.slice(last, match.index) });
    }
    const full = match[0];
    if (full.startsWith('<!--')) {
      last = re.lastIndex;
      continue;
    }
    const name = match[1].toLowerCase();
    const attrs = match[2] ?? '';
    const closing = full.startsWith('</');
    const selfClosing = !closing && /\/\s*>$/.test(full);
    tokens.push({ kind: 'tag', name, closing, selfClosing, attrs });
    last = re.lastIndex;
  }
  if (last < html.length) {
    tokens.push({ kind: 'text', value: html.slice(last) });
  }
  return tokens;
}

function isTag(token: Token | undefined): token is TagToken {
  return !!token && token.kind === 'tag';
}

function isClosing(token: Token | undefined, name?: string): boolean {
  return isTag(token) && token.closing && (name == null || token.name === name);
}

function isOpenBlock(token: Token | undefined, exclude?: string): token is TagToken {
  return (
    isTag(token) && !token.closing && BLOCK_TAGS.has(token.name) && token.name !== exclude
  );
}

function pushInline(target: InlineNode[], node: InlineNode) {
  if (node.type === 'text') {
    if (!node.text) return;
    const prev = target[target.length - 1];
    if (prev?.type === 'text') {
      prev.text += node.text;
      return;
    }
  }
  target.push(node);
}

function isEmptyInline(nodes: InlineNode[]): boolean {
  return nodes.every(node => {
    if (node.type === 'text') return !node.text.trim();
    if (node.type === 'br') return true;
    if (
      node.type === 'link' ||
      node.type === 'bold' ||
      node.type === 'italic' ||
      node.type === 'underline'
    ) {
      return isEmptyInline(node.children);
    }
    return false;
  });
}

function parseInlineChildren(
  tokens: Token[],
  start: number,
  stopTags: Set<string>,
): { nodes: InlineNode[]; next: number } {
  const nodes: InlineNode[] = [];
  let i = start;
  while (i < tokens.length) {
    const token = tokens[i];
    if (token.kind === 'text') {
      pushInline(nodes, { type: 'text', text: decodeEntities(token.value) });
      i += 1;
      continue;
    }
    if (token.closing) {
      if (stopTags.has(token.name)) break;
      i += 1;
      continue;
    }
    if (token.name === 'br') {
      pushInline(nodes, { type: 'br' });
      i += 1;
      continue;
    }
    if (token.name === 'img' || BLOCK_TAGS.has(token.name)) {
      break;
    }
    if (token.selfClosing) {
      i += 1;
      continue;
    }
    if (token.name === 'a') {
      const href = getAttr(token.attrs, 'href');
      const child = parseInlineChildren(tokens, i + 1, new Set(['a']));
      pushInline(nodes, { type: 'link', href, children: child.nodes });
      i = child.next + 1;
      continue;
    }
    if (token.name === 'strong' || token.name === 'b') {
      const child = parseInlineChildren(tokens, i + 1, new Set([token.name]));
      pushInline(nodes, { type: 'bold', children: child.nodes });
      i = child.next + 1;
      continue;
    }
    if (token.name === 'em' || token.name === 'i') {
      const child = parseInlineChildren(tokens, i + 1, new Set([token.name]));
      pushInline(nodes, { type: 'italic', children: child.nodes });
      i = child.next + 1;
      continue;
    }
    if (token.name === 'u') {
      const child = parseInlineChildren(tokens, i + 1, new Set(['u']));
      pushInline(nodes, { type: 'underline', children: child.nodes });
      i = child.next + 1;
      continue;
    }
    const child = parseInlineChildren(tokens, i + 1, new Set([token.name]));
    child.nodes.forEach(n => pushInline(nodes, n));
    i = child.next + 1;
  }
  return { nodes, next: i };
}

/** 跳过当前闭合标签（若匹配） */
function skipClose(tokens: Token[], index: number, name: string) {
  return isClosing(tokens[index], name) ? index + 1 : index;
}

function flushPending(blocks: BlockNode[], pending: InlineNode[]) {
  if (!pending.length || isEmptyInline(pending)) return [] as InlineNode[];
  blocks.push({ type: 'paragraph', children: [...pending] });
  return [] as InlineNode[];
}

/**
 * 解析块级内容到 stopTags 闭合为止。
 * 支持嵌套 div/p/section 等，避免子块被跳过导致空白。
 */
function parseBlocks(
  tokens: Token[],
  start: number,
  stopTags: Set<string> | null,
): { blocks: BlockNode[]; next: number } {
  const blocks: BlockNode[] = [];
  let pending: InlineNode[] = [];
  let i = start;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.kind === 'text') {
      pushInline(pending, { type: 'text', text: decodeEntities(token.value) });
      i += 1;
      continue;
    }

    if (token.closing) {
      if (stopTags?.has(token.name)) break;
      i += 1;
      continue;
    }

    if (token.name === 'br') {
      pushInline(pending, { type: 'br' });
      i += 1;
      continue;
    }

    if (token.name === 'img') {
      pending = flushPending(blocks, pending);
      const src = getAttr(token.attrs, 'src');
      if (src) blocks.push({ type: 'image', src });
      i += 1;
      continue;
    }

    if (token.name === 'ul' || token.name === 'ol') {
      pending = flushPending(blocks, pending);
      const ordered = token.name === 'ol';
      const listName = token.name;
      const items: InlineNode[][] = [];
      i += 1;
      while (i < tokens.length) {
        const cur = tokens[i];
        if (isClosing(cur, listName)) {
          i += 1;
          break;
        }
        if (isTag(cur) && !cur.closing && cur.name === 'li') {
          const inline = parseInlineChildren(tokens, i + 1, new Set(['li']));
          let nodes = inline.nodes;
          let next = inline.next;
          // li 内还有嵌套块时，继续解析并把段落文本并入该项
          while (isOpenBlock(tokens[next], 'li')) {
            const nested = parseBlocks(tokens, next, new Set(['li']));
            nested.blocks.forEach(block => {
              if (block.type === 'paragraph' || block.type === 'heading') {
                if (nodes.length) pushInline(nodes, { type: 'br' });
                block.children.forEach(n => pushInline(nodes, n));
              }
            });
            next = nested.next;
          }
          items.push(nodes);
          i = skipClose(tokens, next, 'li');
          continue;
        }
        i += 1;
      }
      if (items.length) blocks.push({ type: 'list', ordered, items });
      continue;
    }

    if (/^h[1-6]$/.test(token.name)) {
      pending = flushPending(blocks, pending);
      const level = Number(token.name.slice(1));
      const name = token.name;
      const inline = parseInlineChildren(tokens, i + 1, new Set([name]));
      let children = inline.nodes;
      let next = inline.next;
      while (isOpenBlock(tokens[next])) {
        const nested = parseBlocks(tokens, next, new Set([name]));
        nested.blocks.forEach(block => {
          if (block.type === 'paragraph' || block.type === 'heading') {
            if (children.length) pushInline(children, { type: 'br' });
            block.children.forEach(n => pushInline(children, n));
          }
        });
        next = nested.next;
      }
      if (!isEmptyInline(children)) {
        blocks.push({ type: 'heading', level, children });
      }
      i = skipClose(tokens, next, name);
      continue;
    }

    // 常见容器：递归解析子树，修复 <div><p>…</p></div> 丢内容
    if (
      token.name === 'p' ||
      token.name === 'div' ||
      token.name === 'section' ||
      token.name === 'article' ||
      token.name === 'blockquote' ||
      token.name === 'figure' ||
      token.name === 'figcaption' ||
      token.name === 'td' ||
      token.name === 'th' ||
      token.name === 'header' ||
      token.name === 'footer' ||
      token.name === 'main' ||
      token.name === 'aside' ||
      token.name === 'table' ||
      token.name === 'thead' ||
      token.name === 'tbody' ||
      token.name === 'tfoot' ||
      token.name === 'tr'
    ) {
      pending = flushPending(blocks, pending);
      const name = token.name;
      const stop = new Set([name]);
      const inline = parseInlineChildren(tokens, i + 1, stop);
      const hasNestedBlock = isOpenBlock(tokens[inline.next]);

      if (hasNestedBlock) {
        if (!isEmptyInline(inline.nodes)) {
          blocks.push({ type: 'paragraph', children: inline.nodes });
        }
        const nested = parseBlocks(tokens, inline.next, stop);
        if (nested.blocks.length) {
          blocks.push(...nested.blocks);
        } else if (isEmptyInline(inline.nodes)) {
          blocks.push({ type: 'spacer' });
        }
        i = skipClose(tokens, nested.next, name);
      } else if (!isEmptyInline(inline.nodes)) {
        blocks.push({ type: 'paragraph', children: inline.nodes });
        i = skipClose(tokens, inline.next, name);
      } else {
        // 空段落（如 <p><br></p>）保留间距，纯包装容器不插 spacer
        if (name === 'p' || name === 'blockquote') {
          blocks.push({ type: 'spacer' });
        }
        i = skipClose(tokens, inline.next, name);
      }
      continue;
    }

    if (token.selfClosing) {
      i += 1;
      continue;
    }

    // 未知容器：解包子节点
    pending = flushPending(blocks, pending);
    const nested = parseBlocks(tokens, i + 1, new Set([token.name]));
    blocks.push(...nested.blocks);
    i = skipClose(tokens, nested.next, token.name);
  }

  flushPending(blocks, pending);
  return { blocks, next: i };
}

/** 将 HTML 解析为可原生渲染的块节点 */
export function parseRichHtml(html?: string | null): BlockNode[] {
  const source = html?.trim();
  if (!source) return [];

  const tokens = tokenize(source);
  const { blocks } = parseBlocks(tokens, 0, null);
  return blocks.filter((block, index, arr) => {
    if (block.type !== 'spacer') return true;
    return index > 0 && index < arr.length - 1;
  });
}

function renderInline(
  nodes: InlineNode[],
  keyPrefix: string,
  baseStyle?: StyleProp<TextStyle>,
): React.ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (node.type === 'text') {
      return (
        <Text key={key} style={baseStyle}>
          {node.text}
        </Text>
      );
    }
    if (node.type === 'br') {
      return (
        <Text key={key} style={baseStyle}>
          {'\n'}
        </Text>
      );
    }
    if (node.type === 'bold') {
      return (
        <Text key={key} style={[baseStyle, { fontWeight: '600' }]}>
          {renderInline(node.children, key)}
        </Text>
      );
    }
    if (node.type === 'italic') {
      return (
        <Text key={key} style={[baseStyle, { fontStyle: 'italic' }]}>
          {renderInline(node.children, key)}
        </Text>
      );
    }
    if (node.type === 'underline') {
      return (
        <Text key={key} style={[baseStyle, { textDecorationLine: 'underline' }]}>
          {renderInline(node.children, key)}
        </Text>
      );
    }
    return (
      <Text
        key={key}
        style={[baseStyle, { color: '#6D925E' }]}
        onPress={() => {
          if (node.href) Linking.openURL(node.href).catch(() => undefined);
        }}>
        {renderInline(node.children, key)}
      </Text>
    );
  });
}

const textBase: TextStyle = {
  fontSize: 14,
  lineHeight: 22,
  color: AppTheme.textPrimary,
};

/** 将解析结果渲染为原生组件 */
export function renderRichHtmlBlocks(blocks: BlockNode[]) {
  return blocks.map((block, index) => {
    const key = `block-${index}`;
    if (block.type === 'spacer') {
      return <View key={key} style={{ height: 8 }} />;
    }
    if (block.type === 'image') {
      return (
        <Image
          key={key}
          source={{ uri: block.src }}
          style={{ width: '100%', height: 180, marginBottom: 8, borderRadius: 8 }}
          resizeMode="cover"
        />
      );
    }
    if (block.type === 'heading') {
      return (
        <Text key={key} style={[textBase, { fontWeight: '600', fontSize: 15, marginBottom: 8 }]}>
          {renderInline(block.children, key)}
        </Text>
      );
    }
    if (block.type === 'list') {
      return (
        <View key={key} style={{ marginBottom: 8 }}>
          {block.items.map((item, itemIndex) => (
            <View key={`${key}-item-${itemIndex}`} style={{ flexDirection: 'row', marginBottom: 4 }}>
              <Text style={[textBase, { width: 18 }]}>
                {block.ordered ? `${itemIndex + 1}.` : '•'}
              </Text>
              <Text style={[textBase, { flex: 1 }]}>{renderInline(item, `${key}-${itemIndex}`)}</Text>
            </View>
          ))}
        </View>
      );
    }
    return (
      <Text key={key} style={[textBase, { marginBottom: 8 }]}>
        {renderInline(block.children, key)}
      </Text>
    );
  });
}
