<?php

class Fbf_Manage_Fitting_Admin_Ajax
{
    /**
     * The ID of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $plugin_name    The ID of this plugin.
     */
    private $plugin_name;

    /**
     * The version of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $version    The current version of this plugin.
     */
    private $version;

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     * @param      string    $plugin_name       The name of this plugin.
     * @param      string    $version    The version of this plugin.
     */
    public function __construct( $plugin_name, $version ) {
        $this->plugin_name = $plugin_name;
        $this->version = $version;
    }

    public function fbf_manage_fitting_setup_thickbox()
    {
        check_ajax_referer($this->plugin_name, 'ajax_nonce');
        global $wpdb;
        $garages_table = $wpdb->prefix . 'fbf_garages';
        $order_id = filter_var($_POST['post_id'], FILTER_SANITIZE_STRING);
        $order = wc_get_order($order_id);
        $is_fitting = $order->get_meta('_is_national_fitting', true);
        $radius = 45;
            if($is_fitting){
            $selected_garage = get_post_meta($order_id, '_gs_selected_garage', true);
        }
        // Get products first
        $items = $order->get_items();
        $products = [];
        foreach($items as $item){
            $products[] = [
                'id' => $item->get_id(),
                'quantity' => $item->get_quantity(),
            ];
        }

        // Then get garage ids
        $app = new \App\Controllers\App();
        $garage_ids = $app::get_garage_ids($order->get_shipping_postcode(), $radius, 'default', $products);
        $garages = [];
        if(count($garage_ids['ids'])){
            foreach($garage_ids['ids'] as $garage_id){
                $q = $wpdb->prepare("SELECT *
                    FROM {$garages_table}
                    WHERE centre_id = %s", $garage_id['id']);
                $r = $wpdb->get_row($q);
                if($r){
                    $garages[] = [
                        'name' => $r->reporting_name,
                        'trading_name' => $r->trading_name,
                        'id' => $garage_id['id'],
                        'address_1' => $r->address_1,
                        'address_2' => $r->address_2,
                        'town_city' => $r->town_city,
                        'county' => $r->county,
                        'postcode' => $r->postcode,
                        'telephone' => $r->telephone_number,
                        'email_address' => $r->email_address,
                        'selected' => $r->centre_id === $selected_garage['id'] || false,
                        'distance_miles' => $garage_id['miles'],
                    ];
                }
            }
        }

        if(count($garage_ids)){
            $status = 'success';
        }else{
            $status = 'error';
            $error = '$garages is empty';
        }

        WC()->session->set('gs_garage_ids', $garage_ids['ids']);


        echo json_encode([
            'status' => $status,
            'garages' => $garages,
            'error' => $error,
            'lat' => $garage_ids['ids'][array_search($selected_garage['id'], array_column($garage_ids['ids'], 'id'))]['lat'],
            'long' => $garage_ids['ids'][array_search($selected_garage['id'], array_column($garage_ids['ids'], 'id'))]['long'],
            'order_id' => $order_id,
            'postcode' => $order->get_shipping_postcode(),
            'radius' => $radius,
            'selected_garage_id' => $selected_garage['id'],
            'selected_date' => $selected_garage['date'],
            'selected_time' => $selected_garage['time'],
        ]);
        die();
    }

    public function fbf_manage_fitting_confirm_fitting()
    {
        check_ajax_referer($this->plugin_name, 'ajax_nonce');
        $order_id = filter_var($_POST['order_id'], FILTER_SANITIZE_STRING);
        global $wpdb;
        $table = $wpdb->prefix . 'fbf_garages';
        $garage_id = filter_var($_POST['garage_id'], FILTER_SANITIZE_STRING);
        $date = filter_var($_POST['date'], FILTER_SANITIZE_STRING);
        $time = filter_var($_POST['time'], FILTER_SANITIZE_STRING);
        $order = wc_get_order($order_id);

        // Get current garage id
        $orig_garage_id = get_post_meta($order_id, '_gs_selected_garage', true)['id'];
        if($orig_garage_id!=$garage_id){
            $garage_updated = true;
        }else{
            $garage_updated = false;
        }

        // Get garage from db
        $q = $wpdb->prepare("SELECT * FROM $table WHERE centre_id = '%s'", $garage_id);
        if($r = $wpdb->get_row($q, ARRAY_A)){
            $booking = [
                'id' => $garage_id,
                'date' => $date,
                'time' => $time,
                'name' => $r['trading_name'],
                'address_1' => $r['address_1'],
                'address_2' => $r['address_2'],
                'town' => $r['town_city'],
                'county' => $r['county'],
                'postcode' => $r['postcode'],
                'data' => $r,
                'confirmed' => true,
            ];
            update_post_meta($order_id, '_gs_selected_garage', $booking);
            update_post_meta($order_id, '_national_fitting_garage_id', $garage_id);
            update_post_meta($order_id, '_national_fitting_date_time', [
                'date' => $date,
                'time' => $time,
            ]);

            if(!empty($r['trading_name'])){
                $order->set_shipping_company($r['trading_name']);
            }else{
                $order->set_shipping_company('');
            }

            if(!empty($r['address_1'])){
                $order->set_shipping_address_1($r['address_1']);
            }else{
                $order->set_shipping_address_1('');
            }

            if(!empty($r['address_2'])){
                $order->set_shipping_address_2($r['address_2']);
            }else{
                $order->set_shipping_address_2('');
            }

            if(!empty($r['town_city'])){
                $order->set_shipping_city($r['town_city']);
            }else{
                $order->set_shipping_city('');
            }

            if(!empty($r['county'])){
                $order->set_shipping_state($r['county']);
            }else{
                $order->set_shipping_state('');
            }

            if(!empty($r['postcode'])){
                $order->set_shipping_postcode($r['postcode']);
            }else{
                $order->set_shipping_postcode('');
            }
            $order->save();
            $status = 'success';

            // Here we'll trigger the confirmation email
            $email = WC()->mailer()->get_emails()['WC_Fitting_Confirmation'];
            $email->set_updated($garage_updated);
            $email->set_test_mode(true);
            $email->trigger($order->get_id());

        }else{
            $status = 'error';
            $error = 'Failed to get garage from id: ' . $garage_id;
        }


        $resp = [
            'status' => $status,
            'error' => $error,
        ];
        echo json_encode($resp);
        die();
    }
}
