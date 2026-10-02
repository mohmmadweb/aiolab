<?php
/**
 * موتور فیلدها — متاباکس‌های نوع نوشته، فیلدهای طبقه‌بندی و صفحه‌ی تنظیمات
 * همه از یک تعریف (schema) ساخته، اعتبارسنجی و ذخیره می‌شوند.
 *
 * نوع‌ها: text, textarea, html, number, select, bool, multi, lines, color, date,
 *         url, email, post, posts, media, gallery, repeater, map, heading, json
 * ذخیره: متای پست با کلید _aio_{key}
 */
defined('ABSPATH') || exit;

class AIO_Fields
{
    /** @var array post_type => [ [id, title, fields, context, priority] ] */
    public static array $boxes = [];
    /** @var array taxonomy => fields */
    public static array $terms = [];

    public static function post_box(string $post_type, string $id, string $title, array $fields, string $context = 'normal', string $priority = 'high'): void
    {
        self::$boxes[$post_type][] = compact('id', 'title', 'fields', 'context', 'priority');
    }

    public static function term_fields(string $taxonomy, array $fields): void
    {
        self::$terms[$taxonomy] = $fields;
    }

    public static function all_post_fields(string $post_type): array
    {
        $out = [];
        foreach (self::$boxes[$post_type] ?? [] as $b) $out += $b['fields'];
        return $out;
    }

    /* ---------- گزینه‌ها ---------- */
    public static function options($def): array
    {
        $o = $def['options'] ?? [];
        if (is_callable($o)) $o = call_user_func($o);
        if (is_string($o) && str_starts_with($o, 'list:')) {
            $list = aio_list(substr($o, 5), []);
            $o = [];
            foreach ($list as $item) {
                if (is_array($item)) $o[(string) ($item['id'] ?? $item['name'])] = (string) ($item['name'] ?? $item['id']);
                else $o[(string) $item] = (string) $item;
            }
        }
        if (is_string($o) && str_starts_with($o, 'posts:')) {
            $o = self::post_options(substr($o, 6));
        }
        if (is_string($o) && str_starts_with($o, 'terms:')) {
            $tax = substr($o, 6);
            $o = [];
            foreach (get_terms(['taxonomy' => $tax, 'hide_empty' => false]) as $t) $o[$t->slug] = $t->name;
        }
        if (array_is_list($o)) $o = array_combine(array_map('strval', $o), array_map('strval', $o));
        return $o;
    }

    public static function post_options(string $post_type, string $key = 'id'): array
    {
        $o = [];
        foreach (get_posts(['post_type' => $post_type, 'post_status' => ['publish', 'pending', 'draft'], 'numberposts' => 500, 'orderby' => 'title', 'order' => 'ASC']) as $p) {
            $o[$key === 'slug' ? $p->post_name : (string) $p->ID] = $p->post_title . ($p->post_status !== 'publish' ? ' (' . get_post_status_object($p->post_status)->label . ')' : '');
        }
        return $o;
    }

    /* ---------- رندر ---------- */
    public static function render(string $name, string $key, array $def, $value): string
    {
        $type = $def['type'] ?? 'text';
        $id = 'aio-' . sanitize_html_class(str_replace(['[', ']'], ['-', ''], $name));
        $label = $def['label'] ?? $key;
        $desc = !empty($def['desc']) ? '<p class="description">' . wp_kses_post($def['desc']) . '</p>' : '';
        $ph = !empty($def['placeholder']) ? ' placeholder="' . esc_attr($def['placeholder']) . '"' : '';
        $width = $def['width'] ?? (in_array($type, ['textarea', 'html', 'repeater', 'lines', 'map', 'json', 'gallery'], true) ? 'full' : 'half');
        $input = '';

        switch ($type) {
            case 'heading':
                return '<div class="aio-f aio-f-heading full"><h3>' . esc_html($label) . '</h3>' . $desc . '</div>';
            case 'textarea':
                $input = '<textarea id="' . $id . '" name="' . esc_attr($name) . '" rows="' . (int) ($def['rows'] ?? 4) . '"' . $ph . '>' . esc_textarea((string) $value) . '</textarea>';
                break;
            case 'html':
            case 'json':
                $v = $type === 'json' && !is_string($value) ? wp_json_encode($value, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) : (string) $value;
                $input = '<textarea class="code" dir="ltr" id="' . $id . '" name="' . esc_attr($name) . '" rows="' . (int) ($def['rows'] ?? 8) . '">' . esc_textarea($v) . '</textarea>';
                break;
            case 'lines':
                $v = is_array($value) ? implode("\n", $value) : (string) $value;
                $input = '<textarea id="' . $id . '" name="' . esc_attr($name) . '" rows="' . (int) ($def['rows'] ?? 4) . '"' . $ph . '>' . esc_textarea($v) . '</textarea>';
                $desc = $desc ?: '<p class="description">هر مورد در یک خط.</p>';
                break;
            case 'number':
                $input = '<input type="number" id="' . $id . '" name="' . esc_attr($name) . '" value="' . esc_attr((string) $value) . '" step="' . esc_attr($def['step'] ?? 'any') . '"' . $ph . ' dir="ltr">';
                break;
            case 'bool':
                $input = '<label class="aio-switch"><input type="hidden" name="' . esc_attr($name) . '" value="0"><input type="checkbox" id="' . $id . '" name="' . esc_attr($name) . '" value="1" ' . checked(aio_bool($value), true, false) . '> <span>' . esc_html($def['on_label'] ?? 'بله') . '</span></label>';
                break;
            case 'select':
                $opts = self::options($def);
                $input = '<select id="' . $id . '" name="' . esc_attr($name) . '">';
                if (!isset($def['required'])) $input .= '<option value="">— انتخاب کنید —</option>';
                $found = false;
                foreach ($opts as $k => $v) {
                    $sel = ((string) $value === (string) $k);
                    $found = $found || $sel;
                    $input .= '<option value="' . esc_attr($k) . '" ' . selected($sel, true, false) . '>' . esc_html($v) . '</option>';
                }
                if (!$found && $value !== '' && $value !== null) $input .= '<option value="' . esc_attr($value) . '" selected>' . esc_html($value) . ' (خارج از فهرست)</option>';
                $input .= '</select>';
                break;
            case 'multi':
                $opts = self::options($def);
                $vals = array_map('strval', (array) $value);
                $input = '<div class="aio-multi">';
                $input .= '<input type="hidden" name="' . esc_attr($name) . '[]" value="">';
                foreach ($opts as $k => $v) {
                    $input .= '<label><input type="checkbox" name="' . esc_attr($name) . '[]" value="' . esc_attr($k) . '" ' . checked(in_array((string) $k, $vals, true), true, false) . '> ' . esc_html($v) . '</label>';
                }
                foreach (array_diff($vals, array_map('strval', array_keys($opts))) as $extra) {
                    if ($extra === '') continue;
                    $input .= '<label class="extra"><input type="checkbox" name="' . esc_attr($name) . '[]" value="' . esc_attr($extra) . '" checked> ' . esc_html($extra) . '</label>';
                }
                $input .= '</div>';
                $width = 'full';
                break;
            case 'color':
                $input = '<input type="text" class="aio-color" id="' . $id . '" name="' . esc_attr($name) . '" value="' . esc_attr((string) $value) . '" dir="ltr">';
                break;
            case 'date':
                $input = '<input type="date" id="' . $id . '" name="' . esc_attr($name) . '" value="' . esc_attr((string) $value) . '" dir="ltr">';
                if ($value) $desc .= '<p class="description">شمسی: ' . esc_html(aio_jdate('Y/m/d', strtotime($value))) . '</p>';
                break;
            case 'url':
            case 'email':
                $input = '<input type="' . $type . '" id="' . $id . '" name="' . esc_attr($name) . '" value="' . esc_attr((string) $value) . '"' . $ph . ' dir="ltr">';
                break;
            case 'post':
                $opts = self::post_options($def['post_type'], $def['key'] ?? 'id');
                $input = '<select id="' . $id . '" name="' . esc_attr($name) . '"><option value="">— هیچ —</option>';
                foreach ($opts as $k => $v) $input .= '<option value="' . esc_attr($k) . '" ' . selected((string) $value, (string) $k, false) . '>' . esc_html($v) . '</option>';
                $input .= '</select>';
                break;
            case 'posts':
                $opts = self::post_options($def['post_type'], $def['key'] ?? 'id');
                $input = '<div class="aio-posts" data-options="' . esc_attr(aio_json($opts)) . '" data-value="' . esc_attr(aio_json(array_values(array_map('strval', (array) $value)))) . '"><input type="hidden" name="' . esc_attr($name) . '" value="' . esc_attr(aio_json(array_values(array_map('strval', (array) $value)))) . '"></div>';
                $width = 'full';
                break;
            case 'media':
                $url = $value ? wp_get_attachment_image_url((int) $value, 'thumbnail') : '';
                $input = '<div class="aio-media"><input type="hidden" id="' . $id . '" name="' . esc_attr($name) . '" value="' . esc_attr((string) $value) . '">'
                    . '<img src="' . esc_url($url ?: '') . '" alt="" style="' . ($url ? '' : 'display:none') . '">'
                    . '<button type="button" class="button aio-media-pick">انتخاب تصویر</button> <button type="button" class="button-link aio-media-clear">حذف</button></div>';
                break;
            case 'gallery':
                $items = [];
                foreach ((is_array($value) ? $value : []) as $g) {
                    $att = (int) ($g['att'] ?? 0);
                    $items[] = ['att' => $att, 't' => (string) ($g['t'] ?? ''), 'c' => (string) ($g['c'] ?? ''), 'url' => $att ? (string) wp_get_attachment_image_url($att, 'thumbnail') : ''];
                }
                $input = '<div class="aio-gallery" data-value="' . esc_attr(aio_json($items)) . '"><input type="hidden" name="' . esc_attr($name) . '" value="' . esc_attr(aio_json($items)) . '"></div>';
                $width = 'full';
                break;
            case 'repeater':
                $val = is_array($value) ? array_values($value) : [];
                $input = '<div class="aio-repeater" data-schema="' . esc_attr(aio_json(self::js_schema($def['fields']))) . '" data-value="' . esc_attr(aio_json($val)) . '" data-label="' . esc_attr($def['item_label'] ?? 'مورد') . '" data-title-key="' . esc_attr($def['title_key'] ?? '') . '">'
                    . '<input type="hidden" name="' . esc_attr($name) . '" value="' . esc_attr(aio_json($val)) . '"></div>';
                $width = 'full';
                break;
            case 'map':
                $input = '<div class="aio-map" data-lat="' . esc_attr($def['lat'] ?? 'lat') . '" data-lng="' . esc_attr($def['lng'] ?? 'lng') . '"></div>';
                $width = 'full';
                break;
            default:
                $input = '<input type="text" id="' . $id . '" name="' . esc_attr($name) . '" value="' . esc_attr(is_scalar($value) ? (string) $value : '') . '"' . $ph . (!empty($def['ltr']) ? ' dir="ltr"' : '') . '>';
        }
        return '<div class="aio-f aio-f-' . esc_attr($type) . ' ' . esc_attr($width) . '" data-key="' . esc_attr($key) . '"><label for="' . $id . '">' . esc_html($label) . '</label>' . $input . $desc . '</div>';
    }

    /** طرح فیلدهای تکرارشونده برای جاوااسکریپت (گزینه‌های پویا حل می‌شوند) */
    public static function js_schema(array $fields): array
    {
        $out = [];
        foreach ($fields as $k => $d) {
            $d['key'] = $k;
            if (isset($d['options'])) {
                $o = self::options($d);
                $d['options'] = array_map(fn($k, $v) => [(string) $k, (string) $v], array_keys($o), array_values($o));
            }
            if (($d['type'] ?? '') === 'post' && !empty($d['post_type'])) {
                $d['type'] = 'select';
                $o = self::post_options($d['post_type'], $d['key_by'] ?? 'id');
                $d['options'] = array_map(fn($k, $v) => [(string) $k, (string) $v], array_keys($o), array_values($o));
            }
            if (($d['type'] ?? '') === 'repeater') $d['fields'] = self::js_schema($d['fields']);
            $out[] = $d;
        }
        return $out;
    }

    /* ---------- اعتبارسنجی ---------- */
    public static function sanitize(array $def, $raw)
    {
        $type = $def['type'] ?? 'text';
        if (is_string($raw)) $raw = wp_unslash($raw);
        switch ($type) {
            case 'heading':
            case 'map':
                return null;
            case 'textarea':
                return sanitize_textarea_field((string) $raw);
            case 'html':
                return current_user_can('unfiltered_html') ? (string) $raw : wp_kses_post((string) $raw);
            case 'json':
                $d = json_decode((string) $raw, true);
                return is_array($d) ? $d : [];
            case 'lines':
                if (is_array($raw)) $raw = implode("\n", $raw);
                $lines = array_map('trim', preg_split('/\r\n|\r|\n/', (string) $raw));
                return array_values(array_filter(array_map('sanitize_text_field', $lines), fn($x) => $x !== ''));
            case 'number':
                $raw = aio_en_digits((string) $raw);
                if ($raw === '' || !is_numeric($raw)) return '';
                return (strpos($raw, '.') !== false) ? (float) $raw : (int) $raw;
            case 'bool':
                return aio_bool($raw) ? 1 : 0;
            case 'select':
                return sanitize_text_field((string) $raw);
            case 'multi':
                return array_values(array_filter(array_map('sanitize_text_field', (array) $raw), fn($x) => $x !== ''));
            case 'color':
                return sanitize_hex_color((string) $raw) ?: '';
            case 'date':
                return preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $raw) ? (string) $raw : '';
            case 'url':
                return esc_url_raw((string) $raw);
            case 'email':
                return sanitize_email((string) $raw);
            case 'post':
            case 'media':
                return ($def['key'] ?? 'id') === 'slug' ? sanitize_title((string) $raw) : (int) $raw;
            case 'posts':
                $arr = is_array($raw) ? $raw : json_decode((string) $raw, true);
                $arr = is_array($arr) ? $arr : [];
                return array_values(array_filter(array_map(fn($x) => ($def['key'] ?? 'id') === 'slug' ? sanitize_title((string) $x) : (int) $x, $arr)));
            case 'gallery':
                $arr = is_array($raw) ? $raw : json_decode((string) $raw, true);
                $out = [];
                foreach (array_slice(is_array($arr) ? $arr : [], 0, 30) as $g) {
                    $att = (int) ($g['att'] ?? 0);
                    $c = sanitize_hex_color((string) ($g['c'] ?? '')) ?: '';
                    if (($att && get_post_type($att) === 'attachment') || $c) $out[] = ['att' => $att, 't' => sanitize_text_field((string) ($g['t'] ?? '')), 'c' => $att ? '' : $c];
                }
                return $out;
            case 'repeater':
                $arr = is_array($raw) ? $raw : json_decode((string) $raw, true);
                if (!is_array($arr)) return [];
                $out = [];
                foreach ($arr as $item) {
                    if (!is_array($item)) continue;
                    $row = [];
                    foreach ($def['fields'] as $k => $sub) {
                        $v = self::sanitize($sub, $item[$k] ?? null);
                        if ($v !== null) $row[$k] = $v;
                    }
                    $out[] = $row;
                }
                return $out;
            default:
                return sanitize_text_field((string) $raw);
        }
    }

    /* ---------- متاباکس نوشته‌ها ---------- */
    public static function init(): void
    {
        add_action('add_meta_boxes', [__CLASS__, 'add_boxes'], 10, 2);
        add_action('save_post', [__CLASS__, 'save_post'], 10, 2);
        add_action('admin_enqueue_scripts', [__CLASS__, 'assets']);
        add_action('init', function () {
            foreach (array_keys(self::$terms) as $tax) {
                add_action("{$tax}_add_form_fields", fn() => self::term_form($tax, null));
                add_action("{$tax}_edit_form_fields", fn($term) => self::term_form($tax, $term), 10, 1);
                add_action("created_{$tax}", fn($tid) => self::save_term($tax, $tid));
                add_action("edited_{$tax}", fn($tid) => self::save_term($tax, $tid));
            }
        }, 20);
    }

    public static function add_boxes($post_type, $post): void
    {
        foreach (self::$boxes[$post_type] ?? [] as $b) {
            add_meta_box('aio_' . $b['id'], $b['title'], function ($post) use ($b) {
                wp_nonce_field('aio_save_' . $post->post_type, 'aio_fields_nonce');
                echo '<div class="aio-fields">';
                foreach ($b['fields'] as $key => $def) {
                    $val = get_post_meta($post->ID, '_aio_' . $key, true);
                    if (($val === '' || $val === null) && isset($def['default']) && $post->post_status === 'auto-draft') $val = $def['default'];
                    echo self::render('aio[' . $key . ']', $key, $def, $val); // phpcs:ignore
                }
                echo '</div>';
            }, $post_type, $b['context'], $b['priority']);
        }
    }

    public static function save_post($post_id, $post): void
    {
        if (!isset($_POST['aio_fields_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['aio_fields_nonce'])), 'aio_save_' . $post->post_type)) return;
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
        if (!current_user_can('edit_post', $post_id)) return;
        $input = $_POST['aio'] ?? []; // phpcs:ignore — per-field sanitize below
        foreach (self::all_post_fields($post->post_type) as $key => $def) {
            if (in_array($def['type'] ?? '', ['heading', 'map'], true)) continue;
            if (!array_key_exists($key, $input) && !in_array($def['type'] ?? '', ['multi', 'bool'], true)) continue;
            $v = self::sanitize($def, $input[$key] ?? null);
            update_post_meta($post_id, '_aio_' . $key, $v);
        }
        do_action('aio_fields_saved', $post_id, $post);
    }

    /* ---------- فیلدهای طبقه‌بندی ---------- */
    public static function term_form(string $tax, $term): void
    {
        wp_nonce_field('aio_term_' . $tax, 'aio_term_nonce');
        foreach (self::$terms[$tax] as $key => $def) {
            $val = $term ? get_term_meta($term->term_id, 'aio_' . $key, true) : ($def['default'] ?? '');
            if ($term) {
                echo '<tr class="form-field"><th scope="row">' . esc_html($def['label']) . '</th><td class="aio-fields aio-term">' . self::render('aio[' . $key . ']', $key, ['label' => ''] + $def, $val) . '</td></tr>'; // phpcs:ignore
            } else {
                echo '<div class="form-field aio-fields aio-term">' . self::render('aio[' . $key . ']', $key, $def, $val) . '</div>'; // phpcs:ignore
            }
        }
    }

    public static function save_term(string $tax, int $term_id): void
    {
        if (!isset($_POST['aio_term_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['aio_term_nonce'])), 'aio_term_' . $tax)) return;
        if (!current_user_can('manage_categories')) return;
        $input = $_POST['aio'] ?? []; // phpcs:ignore
        foreach (self::$terms[$tax] as $key => $def) {
            update_term_meta($term_id, 'aio_' . $key, self::sanitize($def, $input[$key] ?? null));
        }
        do_action('aio_data_changed');
    }

    public static function assets($hook): void
    {
        $screen = get_current_screen();
        $ours = $screen && (str_starts_with((string) $screen->post_type, 'aio_') || str_starts_with((string) $screen->taxonomy, 'aio_') || str_contains($hook, 'aio-') || $screen->post_type === 'post' || $screen->post_type === 'page');
        if (!$ours) return;
        wp_enqueue_media();
        wp_enqueue_style('wp-color-picker');
        wp_enqueue_style('leaflet', 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css', [], '1.9.4');
        wp_enqueue_script('leaflet', 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js', [], '1.9.4', true);
        wp_enqueue_style('aio-admin', AIO_URL . 'admin/admin.css', [], AIO_VERSION);
        wp_enqueue_script('aio-admin', AIO_URL . 'admin/fields.js', ['jquery', 'wp-color-picker', 'leaflet'], AIO_VERSION, true);
    }
}
AIO_Fields::init();
