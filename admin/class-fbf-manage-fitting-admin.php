<?php

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://4x4tyres.co.uk
 * @since      1.0.0
 *
 * @package    Fbf_Manage_Fitting
 * @subpackage Fbf_Manage_Fitting/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    Fbf_Manage_Fitting
 * @subpackage Fbf_Manage_Fitting/admin
 * @author     Kevin Price-Ward <kevin.price-ward@4x4tyres.co.uk>
 */
class Fbf_Manage_Fitting_Admin {

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

	/**
	 * Register the stylesheets for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_styles() {

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Fbf_Manage_Fitting_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Fbf_Manage_Fitting_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		wp_enqueue_style( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'css/fbf-manage-fitting-admin.css', array(), $this->version, 'all' );

        // Thickbox
        wp_enqueue_style( 'thickbox' );
	}

	/**
	 * Register the JavaScript for the admin area.
	 *
	 * @since    1.0.0
	 */
	public function enqueue_scripts() {

		/**
		 * This function is provided for demonstration purposes only.
		 *
		 * An instance of this class should be passed to the run() function
		 * defined in Fbf_Manage_Fitting_Loader as all of the hooks are defined
		 * in that particular class.
		 *
		 * The Fbf_Manage_Fitting_Loader will then create the relationship
		 * between the defined hooks and the functions defined in this
		 * class.
		 */

		wp_enqueue_script( $this->plugin_name, plugin_dir_url( __FILE__ ) . 'js/fbf-manage-fitting-admin.js', array( 'jquery' ), $this->version, false );
        $ajax_params = array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'ajax_nonce' => wp_create_nonce($this->plugin_name),
        );
        wp_localize_script($this->plugin_name, 'fbf_manage_fitting_admin', $ajax_params);

        // Thickbox
        wp_enqueue_script( 'thickbox' );
	}

    /**
     * Basic Meta Box
     * @since 0.1.0
     * @link http://codex.wordpress.org/Function_Reference/add_meta_box
     */
    public function fbf_manage_fitting_admin_meta_box($type, $post){
        if($type==='shop_order'){
            $order_id = $post->ID;
            $order = wc_get_order($order_id);
            $is_fitting = $order->get_meta('_is_national_fitting', true);
            if($is_fitting){
                add_meta_box(
                    'manage_fitting',
                    'Manage fitting',
                    [$this, 'manage_fitting'],
                    null,
                    'normal',
                    'core',
                    ['order_num'=>$post->ID],
                );
            }
        }
    }

    public function manage_fitting($post, $args){
        $order_num = $args['args']['order_num'];
        if($selected_garage = get_post_meta($order_num, '_gs_selected_garage', true)){
            $is_confirmed = $selected_garage['confirmed'] ?? false;
            $booking_date = new \DateTime($selected_garage['date']);
            if($is_confirmed){
                $time = $selected_garage['time'];
                $time = str_pad($time, 4, '0', STR_PAD_LEFT);
                $hours = substr($time, 0, 2);
                $minutes = substr($time, -2);
                $time  = $hours . ':' . $minutes;
            }else{
                $time = $selected_garage['time']==='am'?'Morning':'Afternoon';
            }
            if(!$is_confirmed){
                printf('<strong>Selected garage:</strong> %s <br/><strong>Date/Time:</strong> %s - %s', $selected_garage['name'], $booking_date->format('jS F Y'), $time);
                printf('<p>Booking status: <span class="fitting-status unconfirmed">Unconfirmed</span> - <a id="trigger-thickbox" href="#" data-post-id="%s">Confirm fitting</a></p>', $post->ID);
            }else{
				var_dump($selected_garage);
                if($selected_garage['confirmation_type']==='time'){
                    printf('<strong>Selected garage:</strong> %s <br/><strong>Date/Time:</strong> %s - %s', $selected_garage['name'], $booking_date->format('jS F Y'), $time);
                }else if($selected_garage['confirmation_type']==='text'){
                    printf('<strong>Selected garage:</strong> %s <br/><strong>Date/Time:</strong> %s - &lsquo;%s&rsquo;', $selected_garage['name'], $booking_date->format('jS F Y'), $selected_garage['confirmation_text']);
                }
                printf('<p>Booking status: <span class="fitting-status confirmed">Confirmed</span> - <a id="trigger-thickbox" href="#" data-post-id="%s">Change fitting</a></p>', $post->ID);
            }
            $html = <<<HTML
<div id="manage-fittings-thickbox" style="display:none;">
    <div class="manage_fitting tb-modal-content" style="margin: 1em 0;">
        <div id="date-text-switch">
            <fieldset style="padding: 0;">
                <legend style="font-weight: bold; padding: 0; color: rgb(60, 67, 74); font-size: 1em;">Select time or add your own text?</legend>
            </fieldset> 
            <label style="margin-right: 16px;">
                <input type="radio" name="time-text-group" value="time" class="time-text-radio" checked/> Select time
            </label>
            <label style="margin-right: 16px;">
                <input type="radio" name="time-text-group" value="text" class="time-text-radio"/> Add text
            </label>
            <div class="text-container" style="margin-top: 0.5em;">
                <textarea style="width: 100%;" rows="3" placeholder="Enter text to be added to confirmation email specifying time and any supporting information"></textarea>
            </div>
        </div>
        <h4 id="garages-heading">Please wait</h4>
        <div class="garages" id="garages-container"></div>
        <button class="button-secondary" id="load-more-garages" disabled><span class="spinner" style="margin: 0 5px 4px 0;"></span> <span class="text">Loading garages...</span></button>
    </div>
    <div class="manage_fitting tb-modal-footer">
        <button class="button-secondary" id="cancel-garage-booking" onclick="tb_remove()">Cancel</button><button class="button-primary" id="confirm-garage-booking" disabled><span class="spinner" style="margin: 0 5px 4px 0; display: none;"></span> <span class="text">Confirm booking</span></button>
    </div>
</div>
HTML;

            echo $html;
        }
    }
}
