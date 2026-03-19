"""
Reusable UI components and styling
"""
import streamlit as st
import streamlit.components.v1 as components


def apply_custom_css():
    """Apply custom CSS styling to match block.xyz design"""
    st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    /* Global styling */
    .stApp {
        background-color: #ffffff;
        color: #000000;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        caret-color: #000000; 
    }
    
    /* Main container */
    .main .block-container {
        background-color: #ffffff;
        padding-top: 2rem;
        padding-left: 1rem;
        padding-right: 1rem;
        max-width: 95% !important;
    }
    
    /* Adjust the content width */
    .css-1d391kg, .css-12oz5g7 {
        max-width: 95% !important;
    }
    
    /* Ensure the app fills the screen width */
    .appview-container .main-container {
        max-width: 100% !important;
    }
    
    /* Remove padding from the container */
    .css-18e3th9 {
        padding: 1rem 1rem !important;
    }
    
    /* Headers */
    h1, h2, h3, h4, h5, h6 {
        font-family: 'Inter', sans-serif;
        color: #000000;
        font-weight: 600;
    }
    
    /* Text elements */
    p, div, span, li {
        font-family: 'Inter', sans-serif;
        color: #000000;
    }
    
    /* All Buttons - Universal Styling with Multiple Selectors */
    .stButton > button,
    button[kind="secondary"],
    button[kind="primary"],
    button[data-testid="baseButton-secondary"],
    button[data-testid="baseButton-primary"],
    div[data-testid="stButton"] > button,
    .stButton button {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 2px solid #000000 !important;
        border-radius: 8px !important;
        font-family: 'Inter', sans-serif !important;
        font-weight: 500 !important;
        padding: 0.5rem 1rem !important;
        transition: all 0.2s ease !important;
    }
    
    .stButton > button:hover,
    button[kind="secondary"]:hover,
    button[kind="primary"]:hover,
    button[data-testid="baseButton-secondary"]:hover,
    button[data-testid="baseButton-primary"]:hover,
    div[data-testid="stButton"] > button:hover,
    .stButton button:hover {
        background-color: #f5f5f5 !important;
        border: 2px solid #000000 !important;
        color: #000000 !important;
    }
    
    /* Text input */
    .stTextInput > div > div > input {
        background-color: #ffffff;
        color: #000000;
        border: 2px solid #e5e5e5;
        border-radius: 8px;
        font-family: 'Inter', sans-serif;
        padding: 0.75rem;
        caret-color: #000000 !important;
        font-size: 13px !important; /* Smaller text size */
    }
    
    .stTextInput > div > div > input:focus {
        border-color: #000000;
        box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
        caret-color: #000000 !important;
    }
    
    /* Textarea styling */
    .stTextArea > div > div > textarea,
    textarea {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 2px solid #e5e5e5 !important;
        border-radius: 8px !important;
        font-family: 'Inter', sans-serif !important;
        padding: 6px 12px !important;
        min-height: 40px !important;
        line-height: 26px !important;
        caret-color: #000000 !important;
        font-size: 14px !important;
    }
    
    /* Success, info, warning messages */
    .stSuccess {
        background-color: #f0f9f0;
        color: #000000;
        border: 1px solid #d4edda;
    }
    
    .stInfo {
        background-color: #f0f8ff;
        color: #000000;
        border: 1px solid #bee5eb;
    }
    
    .stWarning {
        background-color: #fff8f0;
        color: #000000;
        border: 1px solid #ffeaa7;
    }
    
    /* Dropdown styling - Make it light like text inputs */
    .stSelectbox > div > div > div {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 2px solid #e5e5e5 !important;
        border-radius: 8px !important;
    }
    
    /* Table styling - Lighter background with better contrast */
    div[data-testid="stDataFrame"] table {
        border-collapse: collapse;
        width: 100%;
    }
    
    div[data-testid="stDataFrame"] th {
        background-color: #f8f9fa !important;
        color: #000000 !important;
        font-weight: 600 !important;
        border: 1px solid #e5e5e5 !important;
        padding: 8px !important;
    }
    
    div[data-testid="stDataFrame"] td {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 1px solid #e5e5e5 !important;
        padding: 8px !important;
    }
    
    div[data-testid="stDataFrame"] tr:nth-child(even) td {
        background-color: #f8f9fa !important;
    }
    
    /* Dataframe toolbar styling - Fix for black toolbar with black icons */
    div[data-testid="stDataFrameResizable"] button,
    div[data-testid="stDataFrame"] button {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 1px solid #e5e5e5 !important;
        border-radius: 4px !important;
    }

    /* SVG icons inside dataframe toolbar */
    div[data-testid="stDataFrameResizable"] button svg,
    div[data-testid="stDataFrame"] button svg {
        fill: #000000 !important;
        stroke: #000000 !important;
        color: #000000 !important;
    }
    
    /* Toolbar container */
    div[data-testid="stDataFrameResizable"] [data-testid="column-header-toolbar"],
    div[data-testid="stDataFrame"] [data-testid="column-header-toolbar"] {
        background-color: #ffffff !important;
        border: 1px solid #e5e5e5 !important;
    }
    
    /* Tooltip styling for dataframe toolbar and other components */
    div[data-baseweb="tooltip"],
    div[role="tooltip"],
    div[data-testid="stTooltipContent"] {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 1px solid #e5e5e5 !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        padding: 4px 8px !important;
    }
    
    /* Text inside tooltips */
    div[data-baseweb="tooltip"] span,
    div[role="tooltip"] span,
    div[data-testid="stTooltipContent"] span,
    div[data-baseweb="tooltip"] p,
    div[role="tooltip"] p,
    div[data-testid="stTooltipContent"] p {
        color: #000000 !important;
    }
    
    /* Expander styling - Make it lighter */
    .streamlit-expanderHeader,
    div[data-testid="stExpander"] > div:first-child,
    div[data-testid="stExpander"] > details > summary {
        background-color: #f8f9fa !important;
        color: #000000 !important;
        border: 1px solid #e5e5e5 !important;
        border-radius: 8px !important;
    }
    
    /* Selectbox dropdown menu */
    div[data-baseweb="select"] > div {
        background-color: #ffffff !important;
        color: #000000 !important;
        border: 2px solid #e5e5e5 !important;
        border-radius: 8px !important;
        font-size: 13px !important; /* Smaller text size */
    }
    
    /* Make sure selectbox text is visible */
    div[data-baseweb="select"] span {
        color: #000000 !important;
        font-size: 13px !important; /* Smaller text size */
    }
    
    /* Dropdown options - Enhanced styling for better visibility */
    div[role="listbox"] {
        background-color: #ffffff !important;
    }
    
    div[role="listbox"] li,
    div[role="option"] {
        color: #000000 !important;
        background-color: #ffffff !important;
        padding: 6px 12px !important;
        min-height: 30px !important;
        line-height: 18px !important;
        font-size: 13px !important; /* Smaller text size */
    }
    
    div[role="listbox"] li:hover,
    div[role="option"]:hover,
    div[role="option"][aria-selected="true"] {
        background-color: #f5f5f5 !important;
        color: #000000 !important;
    }
    
    /* Dropdown popup menu */
    div[data-baseweb="popover"],
    div[data-baseweb="popover"] div,
    div[data-baseweb="menu"] {
        background-color: #ffffff !important;
        border-color: #e5e5e5 !important;
        color: #000000 !important;
    }
    
    /* Fix for dropdown arrows */
    div[data-baseweb="select"] svg {
        color: #000000 !important;
    }
    
    /* Code block styling - PyCharm-like SQL syntax highlighting */
    .stCodeBlock {
        background-color: #2b2b2b !important; /* Dark background like PyCharm's dark theme */
        border: 1px solid #3c3f41 !important;
        border-radius: 4px !important;
    }
    
    /* Code block background */
    /* Code block styling - PyCharm-like SQL syntax highlighting */
    .stCodeBlock {
        background-color: #2b2b2b !important; /* Dark background like PyCharm's dark theme */
        border: 1px solid #3c3f41 !important;
        border-radius: 4px !important;
    }
    
    /* Code block background */
    .stCodeBlock pre {
        background-color: #2b2b2b !important;
        color: #a9b7c6 !important; /* Default text color */
        font-family: 'JetBrains Mono', 'Consolas', 'Courier New', monospace !important;
        font-size: 14px !important;
        line-height: 1.4 !important;
        padding: 16px !important;
    }
    
    /* SQL Keywords */
    .language-sql .keyword {
        color: #cc7832 !important; /* Orange/gold for keywords like SELECT, FROM */
        font-weight: bold !important;
    }
    
    /* SQL Functions - Make sure ALL functions get colored */
    .language-sql .function,
    .language-sql .name.function,
    .language-sql .entity.name.function {
        color: #a9b7c6 !important; /* Light green for functions */
    }
    
    /* Function names specifically */
    .language-sql .name.function {
        color: #78cc78 !important; /* Green for function names */
    }
    
    /* SQL Strings */
    .language-sql .string {
        color: #6a8759 !important; /* Green for strings */
    }
    
    /* SQL Numbers */
    .language-sql .number,
    .language-sql .constant.numeric {
        color: #6897bb !important; /* Light blue for numbers */
    }
    
    /* SQL Operators */
    .language-sql .operator,
    .language-sql .keyword.operator {
        color: #cc7832 !important; /* Orange for operators */
    }
    
    /* SQL Comments */
    .language-sql .comment {
        color: #808080 !important; /* Gray for comments */
        font-style: italic !important;
    }
    
    /* SQL identifiers (column names) */
    .language-sql .name,
    .language-sql .entity.name.column,
    .language-sql span:not(.function):not(.keyword):not(.operator):not(.string):not(.number):not(.builtin) {
        color: #9876aa !important; /* Purple/pink for column names */
    }
    
    /* SQL special keywords */
    .language-sql .builtin,
    .language-sql .constant.language {
        color: #78cc78 !important; /* Green for special keywords like NULL */
    }
    
    /* Additional rules to catch more elements */
    .language-sql .entity.name.function {
        color: #78cc78 !important; /* Green for functions */
    }
    
    .language-sql .variable,
    .language-sql .column {
        color: #9876aa !important; /* Purple for column names */
    }
    
    /* Ensure function names are properly colored */
    code span:not(.keyword):not(.string):not(.number):not(.operator):not(.punctuation) + span.punctuation + span.punctuation {
        color: #78cc78 !important; /* Green for functions */
    }
    
    /* Ensure all column names get colored */
    .language-sql span:not(.function):not(.keyword):not(.operator):not(.string):not(.number):not(.builtin):not(.punctuation) {
        color: #9876aa !important; /* Purple for column names */
    }
    
    .block-icon {
        display: inline-block;
        width: 32px;
        height: 32px;
        margin-right: 10px;
        vertical-align: middle;
    }
    
    .custom-title {
        font-family: 'Inter', sans-serif;
        font-weight: 700;
        font-size: 2.5rem;
        color: #000000;
        margin-bottom: 1rem;
        display: flex;
        align-items: center;
    }
    </style>
    """, unsafe_allow_html=True)


def render_block_header(title: str):
    """Render the Block logo header with title"""
    st.markdown(f"""
    <div class="custom-title">
        <svg class="block-icon" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="2" width="6" height="6" rx="1" fill="#000000"/>
            <rect x="9" y="2" width="6" height="6" rx="1" fill="#000000"/>
            <rect x="16" y="2" width="6" height="6" rx="1" fill="#000000"/>
            <rect x="2" y="9" width="6" height="6" rx="1" fill="#000000"/>
            <rect x="9" y="9" width="6" height="6" rx="1" fill="#000000"/>
            <rect x="16" y="9" width="6" height="6" rx="1" fill="#000000"/>
            <rect x="2" y="16" width="6" height="6" rx="1" fill="#000000"/>
            <rect x="9" y="16" width="6" height="6" rx="1" fill="#000000"/>
            <rect x="16" y="16" width="6" height="6" rx="1" fill="#000000"/>
        </svg>
        <h3>{title}</h3>
    </div>
    """, unsafe_allow_html=True)


def apply_form_button_styling():
    """Apply custom styling to form submit buttons"""
    st.markdown("""
    <style>
    /* Reset button styling to override Streamlit defaults */
    div[data-testid="stFormSubmitButton"] > button {
        background-color: white !important;
        color: black !important;
        border: 1px solid #ccc !important;
        border-radius: 4px !important;
        font-style: normal !important;
        width: 100% !important;
        padding: 0.25rem 1rem !important;
    }
    
    /* Style for invalid state - red outline */
    .invalid-form div[data-testid="stFormSubmitButton"] > button {
        border: 2px solid red !important;
        color: red !important;
        font-style: italic !important;
    }
    
    /* Hover effect */
    div[data-testid="stFormSubmitButton"] > button:hover {
        background-color: #f0f0f0 !important;
        border-color: #999 !important;
    }
    </style>
    """, unsafe_allow_html=True)

# Define custom SQL syntax highlighting (PyCharm-like)
def add_enhanced_sql_highlighting():
    """Add enhanced SQL syntax highlighting that mimics PyCharm"""
    # This JavaScript enhances the Ace editor's SQL mode to better match PyCharm's SQL highlighting
    js_code = """
    <script>
    // Wait for Ace editor to load
    function enhanceSqlHighlighting() {
        if (typeof ace !== 'undefined') {
            // Define custom SQL highlighting rules
            try {
                // Get the SQL mode
                var SqlMode = ace.require("ace/mode/sql").Mode;
                var TextHighlightRules = ace.require("ace/mode/text_highlight_rules").TextHighlightRules;

                // Define enhanced SQL highlight rules
                var SqlHighlightRules = function() {
                    // Keywords
                    var keywords = (
                        "select|insert|update|delete|from|where|and|or|group|by|order|limit|offset|having|as|case|" +
                        "when|then|else|end|type|left|right|join|on|outer|desc|asc|union|create|table|primary|key|if|" +
                        "foreign|not|references|default|null|inner|cross|natural|database|drop|grant|distinct"
                    );

                    // PostgreSQL specific keywords
                    var pgsqlKeywords = (
                        "partition|over|window|row_number|rank|dense_rank|lead|lag|first_value|last_value|nth_value|" +
                        "lateral|returning|using|recursive|with|materialized|view"
                    );

                    // SQL functions
                    var builtinFunctions = (
                        "avg|count|first|last|max|min|sum|coalesce|ifnull|nullif|nvl|" +
                        "current_date|current_time|current_timestamp|localtime|localtimestamp|" +
                        "extract|position|substring|trim|to_char|to_date|to_number|to_timestamp|" +
                        "date_part|date_trunc|round|cast|convert|" +
                        "lower|upper|initcap|length|lpad|rpad|ltrim|rtrim|replace|regexp_replace|" +
                        "concat|concat_ws|split_part|strpos|substr|" +
                        "row_number|rank|dense_rank|percent_rank|cume_dist|ntile|" +
                        "lag|lead|first_value|last_value|nth_value|" +
                        "array_agg|string_agg|json_agg|jsonb_agg|json_object_agg|jsonb_object_agg|" +
                        "json_build_array|jsonb_build_array|json_build_object|jsonb_build_object|" +
                        "to_json|to_jsonb|array_to_json|row_to_json|" +
                        "json_array_length|jsonb_array_length|json_typeof|jsonb_typeof|" +
                        "json_extract_path|jsonb_extract_path|" +
                        "array_append|array_cat|array_ndims|array_dims|array_length|" +
                        "array_lower|array_upper|array_to_string|string_to_array|unnest"
                    );

                    // Data types
                    var dataTypes = (
                        "int|numeric|decimal|date|varchar|char|bigint|float|double|bit|binary|text|set|timestamp|" +
                        "money|real|number|integer|" +
                        "boolean|bool|smallint|varchar2|nvarchar|smalldatetime|datetime|tinyint|" +
                        "json|jsonb|uuid|xml|bytea|interval|character varying|time|timestamp without time zone|" +
                        "timestamp with time zone|timestamptz|timetz|time without time zone|time with time zone|" +
                        "double precision|real|inet|cidr|macaddr|bit varying|varbit|tsvector|tsquery|point|line|" +
                        "lseg|box|path|polygon|circle|serial|bigserial|smallserial|array"
                    );

                    var keywordMapper = this.createKeywordMapper({
                        "support.function": builtinFunctions,
                        "keyword": keywords + "|" + pgsqlKeywords,
                        "constant.language": "true|false",
                        "storage.type": dataTypes
                    }, "identifier", true);

                    this.$rules = {
                        "start": [
                            {token: "comment", regex: "--.*$"},
                            {token: "comment", start: "/\\*", end: "\\*/"},
                            {token: "string", regex: '".*?"'},
                            {token: "string", regex: "'.*?'"},
                            {token: "string", regex: "`.*?`"},
                            {token: "constant.numeric", regex: "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"},
                            {token: keywordMapper, regex: "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"},
                            {token: "keyword.operator", regex: "\\+|\\-|\\/|\\/\\/|%|<@>|@>|<@|&|\\^|~|<|>|<=|=>|==|!=|<>|="},
                            {token: "paren.lparen", regex: "[\\(]"},
                            {token: "paren.rparen", regex: "[\\)]"},
                            {token: "text", regex: "\\s+"}
                        ]
                    };
                    this.normalizeRules();
                };

                // Make SqlHighlightRules extend TextHighlightRules
                SqlHighlightRules.prototype = Object.create(TextHighlightRules.prototype);
                SqlHighlightRules.prototype.constructor = SqlHighlightRules;

                // Override the default SQL mode highlight rules
                SqlMode.prototype.HighlightRules = SqlHighlightRules;

                console.log("Enhanced SQL syntax highlighting applied");
            } catch (e) {
                console.error("Error enhancing SQL syntax:", e);
            }
        } else {
            // If Ace isn't loaded yet, try again in a moment
            setTimeout(enhanceSqlHighlighting, 500);
        }
    }

    // Start the enhancement process
    enhanceSqlHighlighting();
    </script>
    """
    # Inject the JavaScript
    components.html(js_code, height=0)


def wrap_form_with_validation(is_valid: bool):
    """Wrap a form with validation styling
    
    Args:
        is_valid: Whether the form is valid
        
    Returns:
        close_div_later: Whether to close the div later
    """
    if not is_valid:
        st.markdown('<div class="invalid-form">', unsafe_allow_html=True)
        return True
    return False


def close_validation_wrapper(close_div_needed: bool):
    """Close the validation wrapper if needed
    
    Args:
        close_div_needed: Whether to close the div
    """
    if close_div_needed:
        st.markdown('</div>', unsafe_allow_html=True)
